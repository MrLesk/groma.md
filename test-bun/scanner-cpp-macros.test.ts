import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import scanner from '../plugins/scanners/cpp/src/index.ts'

async function sources(files: Record<string, string>, run: (root: string, selected: string[]) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-cpp-macros-'))
  try {
    for (const [file, source] of Object.entries(files)) await writeFile(path.join(root, file), source)
    await run(root, Object.keys(files))
  } finally { await rm(root, { recursive: true, force: true }) }
}

test.concurrent('C++ selected macro modifiers preserve explicit declarations and ordinary constructor ownership', () => sources({
  'definitions.hpp': '#define API __attribute__((visibility("default")))\n',
  'api.hpp': `#define INLINE inline
#define GUARDED_BY(x) __attribute__((guarded_by(x)))
#define DECLARE(Type) public: void generated();
class API Service {
  DECLARE(Service)
public:
  INLINE Service(): value(0) {}
  int read() const;
  int value GUARDED_BY(lock);
};
`,
  'api.cpp': `int Service::read() const { return observe(value); }\n`,
}, async (root, files) => {
  const outlines = await scanner.readCodeStructure(root, files.map(file => ({ file, symbols: [] })), {}, files)
  expect(outlines.map(outline => {
    const type = outline.declarations[0]!
    return type.kind === 'type' && [type.name, type.line, type.members.map(member => [member.name, member.line, member.visibility])]
  })).toEqual([
    ['Service', 4, [['Service', 7, 'public'], ['read', 8, 'public']]],
    ['Service', 1, [['read', 1, 'public']]],
  ])
  const scan = (await scanner.scan(root, {}, files))!
  expect(scan.operations!.map(operation => operation.name)).toEqual(['Service::read', 'Service::Service'])
  const read = scan.operations!.find(operation => operation.name === 'Service::read')!
  expect(scan.invocations!.map(call => [call.source, call.member])).toEqual([[read.id, 'observe']])
  const header = await readFile(path.join(root, 'api.hpp'), 'utf8')
  expect(scan.operations!.find(operation => operation.name === 'Service::Service')!.position).toBe(header.indexOf('INLINE Service'))
  await expect(scanner.scan(root, {}, ['api.hpp'])).rejects.toThrow('API')
}))

test.concurrent('C++ macro visibility uncertainty omits only unproven outlines and preserves body evidence', () => sources({
  'uncertain.cpp': `#if CONFIG
#define LINKAGE static
#else
#define LINKAGE inline
#endif
#define MEMBERS public: void generated();
LINKAGE void uncertain() { work(); }
class Access {
#if CONFIG
  MEMBERS
  void branchMember() { branchCall(); }
#endif
  void uncertainMember() { memberCall(); }
public:
  void certain() { certainCall(); }
};
`,
  'alias.cpp': `#define CloseConnection Renamed
class Client {
public:
  int CloseConnection(int);
  static bool GameLoop();
};
bool Client::GameLoop() { return work(); }
`,
  'unsafe-alias.cpp': `#define CloseConnection AccessChange
#define AccessChange renamed(int); private: int discarded
class Client { public: int CloseConnection(int); static bool GameLoop(); };
`,
}, async (root, files) => {
  const [outline] = await scanner.readCodeStructure(root, [{ file: files[0]!, symbols: [] }])
  expect(outline!.declarations.map(declaration => declaration.name)).toEqual(['Access'])
  const type = outline!.declarations[0]!
  expect(type.kind === 'type' && type.members.map(member => [member.name, member.visibility])).toEqual([['certain', 'public']])
  const scan = (await scanner.scan(root, {}, [files[0]!]))!
  expect(scan.operations!.map(operation => operation.name)).toEqual(['uncertain', 'Access::branchMember', 'Access::uncertainMember', 'Access::certain'])
  expect(scan.invocations!.map(call => call.member)).toEqual(['work', 'branchCall', 'memberCall', 'certainCall'])
  expect(scan.diagnostics.some(diagnostic => diagnostic.code === 'CPP_MACRO_SOURCE')).toBe(true)
  const [alias] = await scanner.readCodeStructure(root, [{ file: 'alias.cpp', symbols: [] }], {}, ['alias.cpp'])
  const client = alias!.declarations[0]!
  expect(client.kind === 'type' && client.members.map(member => [member.name, member.line, member.visibility]))
    .toEqual([['GameLoop', 5, 'public'], ['GameLoop', 7, 'public']])
  const aliased = (await scanner.scan(root, {}, ['alias.cpp']))!
  expect(aliased.invocations!.map(call => [call.member, call.line])).toEqual([['work', 7]])
  expect(aliased.diagnostics.some(diagnostic => diagnostic.code === 'CPP_MACRO_SCOPE' && diagnostic.line === 4)).toBe(true)
  const [unsafe] = await scanner.readCodeStructure(root, [{ file: 'unsafe-alias.cpp', symbols: [] }], {}, ['unsafe-alias.cpp'])
  const unproven = unsafe!.declarations[0]!
  expect(unproven.kind === 'type' && unproven.members).toEqual([])
}))

test.concurrent('C++ source macros do not invent calls from discarded, stringized or generated arguments', () => sources({
  'calls.cpp': `#define DISCARD(x)
#define STRINGIFY(x) #x
#define BODY(x) x
void run() {
  DISCARD(discarded());
  STRINGIFY(stringized());
  BODY(generated());
  ordinary(argument());
}
`,
  'unknown.hpp': `UNKNOWN class Missing {};\n`,
}, async root => {
  const scan = (await scanner.scan(root, {}, ['calls.cpp']))!
  expect(scan.invocations!.map(call => [call.member, call.line])).toEqual([['ordinary', 8], ['argument', 8]])
  expect(scan.invocations!.every(call => call.unresolved && call.targets.length === 0)).toBe(true)
  await expect(scanner.scan(root, {}, ['unknown.hpp'])).rejects.toThrow('unknown.hpp:1:')
}))

test.concurrent('C++ conditional linkage, initializer, attributes and try syntax preserve branch bodies and positions', () => sources({
  'conditional.cpp': `#ifdef CPP
extern "C" {
#endif
void external() { externalCall(); }
#ifdef CPP
}
#endif
struct Value {
  int count;
  Value():
#if FEATURE
    count(first()),
#else
    count(second()),
#endif
    other(last()) {}
  int other;
  void annotated()
#if FEATURE
    __attribute__((unused))
#endif
  { annotationCall(); }
};
void run() {
#ifdef EXCEPTIONS
  try {
#endif
  work();
#ifdef EXCEPTIONS
  } catch (...) { failed(); }
#endif
}
`,
}, async (root, files) => {
  const scan = (await scanner.scan(root, {}, files))!
  const names = new Map(scan.operations!.map(operation => [operation.id, operation.name]))
  expect(scan.invocations!.map(call => [names.get(call.source), call.member, call.line])).toEqual([
    ['external', 'externalCall', 4], ['Value::Value', 'first', 12], ['Value::Value', 'second', 14],
    ['Value::Value', 'last', 16], ['Value::annotated', 'annotationCall', 22],
    ['run', 'work', 28], ['run', 'failed', 30],
  ])
  expect(scan.diagnostics.some(diagnostic => diagnostic.code === 'CPP_CONDITIONAL_SOURCE')).toBe(true)
}))

test.concurrent('C++ dependent construction, enum bases, default arguments and template comparisons remain ordinary syntax', () => sources({
  'standard.cpp': `#if __has_include(<utility>)
void available();
#endif
enum : unsigned { Ready };
template<class T, int N> struct Value {
  void run(typename T::value_type* data = nullptr, int value = {}) {
    auto result = typename T::value_type(make());
    auto braced = typename T::value_type{make()};
    data->operator()();
    check<N >= 2>();
    static_cast<int>(operand());
    dynamic_cast<T*>(data);
    reinterpret_cast<T*>(data);
    const_cast<T*>(data);
  }
};
using Count = decltype(first(), second());
`,
}, async (root, files) => {
  const scan = (await scanner.scan(root, {}, files))!
  expect(scan.operations!.map(operation => operation.name)).toEqual(['Value::run'])
  expect(scan.invocations!.map(call => [call.member, call.line])).toEqual([
    ['typename T::value_type', 7], ['make', 7], ['make', 8], ['data->operator()', 9], ['check<N >= 2>', 10], ['operand', 11],
  ])
  expect(scan.diagnostics.some(diagnostic => diagnostic.code === 'CPP_MACRO_SOURCE')).toBe(false)
}))

async function source(code: string, run: (root: string) => Promise<void>): Promise<void> {
  await sources({ 'case.cpp': code }, root => run(root))
}

test.concurrent('C++ written shared conditional headers retain both possible owners', () => source(`#define ANNOTATION __attribute__((unused))
class A { public: void run(int); };
class B { public: void run(int); };
ANNOTATION
#if VERSION
void A::run(int x)
#else
void B::run(int x)
#endif
{ work(); }
`, async root => {
 const scan = (await scanner.scan(root, {}, ['case.cpp']))!
 expect(scan.operations!.map(op => op.name).sort()).toEqual(['A::run', 'B::run'])
 const names = new Map(scan.operations!.map(op => [op.id, op.name]))
 expect(scan.invocations!.map(call => [names.get(call.source), call.member, call.line]).sort()).toEqual([['A::run','work',10],['B::run','work',10]])
 const [outline] = await scanner.readCodeStructure(root,[{file:'case.cpp',symbols:[]}])
 expect(outline!.declarations.filter(decl => decl.kind === 'type').flatMap(decl => decl.members.map(member => [decl.name,member.name,member.line]))).toEqual([['A','run',2],['A','run',6],['B','run',3],['B','run',8]])
}))
test.concurrent('C++ member pointers, casts, braced variables and deleted template methods remain ordinary C++', () => source(`struct Item {
 template<class T> void gone(T x) = delete;
 void run() {
   obj.AddConstructor<void(Item::*)()>(setup());
   (obj->*member)(argument());
   this->Base::operator[](index());
   auto value = unsigned(number());
   delete[] (Item*)pointer;
   Stream stream{to_path(name)};
 }
};
template class Store<Item>;
`, async root => {
 const scan = (await scanner.scan(root, {}, ['case.cpp']))!
 expect(scan.operations!.map(op => op.name)).toEqual(['Item::run'])
 expect(scan.invocations!.map(call => call.member)).toEqual(['obj.AddConstructor<void(Item::*)()>','setup','(obj->*member)','argument','this->Base::operator[]','index','number','to_path'])
 expect(scan.diagnostics.some(d => d.code === 'CPP_MACRO_SOURCE')).toBe(false)
}))
test.concurrent('C++ opaque macro callees and deferred bodies do not acquire the written caller', async () => {
 const cases = [
  ['#define GUARD(x) if (x)\n', 'GUARD(true) { hidden(); } after();', ['hidden', 'after']],
  ['#define GUARD(x) if (x)\n', 'GUARD(1 == 1) { hidden(); } after();', ['hidden', 'after']],
  ['#define GUARD(x) if (x)\n#define SHIFT true) {} } void generated(){ if(true\n', 'GUARD(SHIFT) { hidden(); } after();', []],
  ['#define GUARD(x) if (x)\n#define SHIFT true) {} } void generated(){ if(true\n', 'GUARD(1 + SHIFT) { hidden(); } after();', []],
  ['#define MEASURE() sizeof\n','MEASURE()(hidden()); after();',['after']],
  ['#define OPEN() auto deferred = [&] {\n#define CLOSE() };\n','OPEN(); hidden(); CLOSE(); after();',[]],
  ['#define GLUE(a,b) a##b\n#define OPEN() } void generated() {\n','GLUE(OP,EN)(); hidden(); after();',[]],
  ['#define APPLY(x) x\n#define OPEN() auto deferred = [&] {\n#define CLOSE() };\n','APPLY(OPEN()); hidden(); CLOSE(); after();',[]],
 ] as const
 for (const [definitions,body,calls] of cases) await source(`${definitions}void hidden(); void after();\nvoid outer(){${body}}\n`, async root => {
   const scan = (await scanner.scan(root,{},['case.cpp']))!
  expect(scan.operations!.map(op=>op.name)).toEqual(['outer'])
  expect(scan.invocations!.map(call=>call.member)).toEqual([...calls])
 })
 await source('#if USE_ALIAS\n#define adapted platform\n#else\nstatic int adapted(){ return actual(); }\n#endif\n', async root => {
  const scan = (await scanner.scan(root, {}, ['case.cpp']))!
  expect(scan.operations!.map(operation => operation.name)).toEqual(['adapted'])
  expect(scan.invocations!.map(call => [call.member, call.line])).toEqual([['actual', 4]])
 })
})
test.concurrent('C++ macro closing depth preserves only proven class members and caller owners', async () => {
 for (const [replacement,names,calls] of [
  ['} }; class Generated { void generated() {',['Written::first'],[]],
  ['} void generated() {',['Written::first','Written::second'],['hidden']],
 ] as const) await source(`#define ESCAPE() ${replacement}\nclass Written { public:\nvoid first(){ESCAPE();hidden();}\nvoid second(){hidden();}\n};\n`,async root=>{
   const scan = (await scanner.scan(root,{},['case.cpp']))!
  expect(scan.operations!.map(op=>op.name).sort()).toEqual([...names])
  expect(scan.invocations!.map(call=>call.member)).toEqual([...calls])
   const outlines = await scanner.readCodeStructure(root,[{file:'case.cpp',symbols:[]}])
  expect(outlines[0]!.declarations.flatMap(decl=>decl.kind==='type'?decl.members.map(m=>`${decl.name}::${m.name}`):[])).toEqual([...names])
 })
 await source('#define SHIFT() }; class Generated {\nclass Written { SHIFT(); public: void run(){hidden();} };\n',async root=>{
   const scan = (await scanner.scan(root,{},['case.cpp']))!
  expect(scan.operations).toEqual([])
  expect(scan.invocations).toEqual([])
 })
})
test.concurrent('C++ bounded fixed paste names preserve following source and reject unsafe selected alternatives',async()=>{
 await source('#define DECL(name) struct name ## Pool {};\nDECL(Any)\nvoid after(){work();}\n',async root=>{
   const scan = (await scanner.scan(root,{},['case.cpp']))!
  expect(scan.operations!.map(op=>op.name)).toEqual(['after'])
  expect(scan.invocations!.map(call=>[call.member,call.line])).toEqual([['work',3]])
 })
 for(const sourceText of [
 '#define BadPool }\n#define DECL(name) struct name ## Pool {};\nDECL(Any)\nvoid after(){}',
 '#define Pool }\n#define DECL(name) struct name ## Pool {};\nDECL(Any)\nvoid after(){}',
 '#define BadPool BadPool\n#define DECL(name) struct name ## Pool {};\nDECL(Any)\nvoid after(){}',
 '#define DECL(a,b) struct a ## b {};\nDECL(Any,Pool)\nvoid after(){}',
 '#define DECL(name) struct name ## 1 {};\nDECL(Any)\nvoid after(){}',
 ]) await source(sourceText,async root=>{await expect(scanner.scan(root,{},['case.cpp'])).rejects.toThrow('scope boundary')})
})
test.concurrent('C++ quoted directives and real comments preserve following physical source',async()=>{
 const literal='"/*stdin*\\\\"'
 for(const replacement of [literal,`(${literal})`,`"prefix" ${literal}`,"1 // Don't hide normal code",'1 /* real comment */ \\\n + 2']) await source(`void before(){}\n#define STRINGMARK ${replacement}\nvoid middle(){before();}\n/* real comment */\nvoid after(){before();}\n`,async root=>{
   const scan = (await scanner.scan(root,{},['case.cpp']))!
   const code = await readFile(path.join(root, 'case.cpp'), 'utf8')
  const middle=scan.operations!.find(op=>op.name==='middle')!
  expect(middle.position).toBe(code.indexOf('void middle'))
  expect(scan.operations!.map(op=>op.name).sort()).toEqual(['after','before','middle'])
  expect(scan.invocations!.filter(call=>call.source===middle.id).map(call=>[call.member,call.position])).toEqual([['before',code.indexOf('before();')]])
 })
})
test.concurrent('C++ literal namespace and transparent export boundaries keep later ownership exact',async()=>{
 const definitions=`#define BEGIN namespace api { inline namespace v1 {
#define END } }
#if MODULE
#define EXPORT_BEGIN export {
#define EXPORT_END }
#else
#define EXPORT_BEGIN
#define EXPORT_END
#endif
`
 await source(`${definitions}BEGIN\nEXPORT_BEGIN\nvoid inside(){work();}\nEXPORT_END\nvoid after(){work();}\nEND\nvoid outside(){work();}\n`,async root=>{
   const scan = (await scanner.scan(root,{},['case.cpp']))!
  expect(scan.operations!.map(op=>op.name).sort()).toEqual(['api::v1::after','api::v1::inside','outside'])
   const names = new Map(scan.operations!.map(op=>[op.id,op.name]))
  expect(scan.invocations!.map(call=>[names.get(call.source),call.line]).sort()).toEqual([['api::v1::after',14],['api::v1::inside',12],['outside',16]])
 })
 for(const ending of ['#define END }','#if CONFIG\n#define END }\n#else\n#define END } }\n#endif']) await source(`#define BEGIN namespace api { inline namespace v1 {\n${ending}\nBEGIN\nvoid inside(){}\nEND\nvoid after(){}\n`,async root=>{
  await expect(scanner.scan(root,{},['case.cpp'])).rejects.toThrow()
 })
})
test.concurrent('C++ opaque external declaration modifiers and typed macro arguments retain only independent facts',async()=>{
 await source('#define DEFINE(type) type Generated\nstruct Generated { void run(); };\nDEFINE(inline void)::run(){hidden();}\nvoid after(){known();}\n', async root => {
  const scan = (await scanner.scan(root, {}, ['case.cpp']))!
  expect(scan.operations!.map(operation => operation.name)).toEqual(['after'])
  expect(scan.invocations!.map(call => [call.member, call.line])).toEqual([['known', 4]])
 })
 await source('void WINAPI sdk(IN int value){}\nvoid run(){va_arg(ap,const char*); after();}\n',async root=>{
   const scan = (await scanner.scan(root,{},['case.cpp']))!
  expect(scan.files.map(file=>file.file)).toEqual(['case.cpp'])
  expect(scan.operations!.map(op=>op.name)).toEqual(['run'])
  expect(scan.invocations).toEqual([])
  expect(scan.diagnostics.some(issue=>issue.code==='CPP_MACRO_SCOPE'&&issue.line===1)).toBe(true)
   const outline = await scanner.readCodeStructure(root,[{file:'case.cpp',symbols:[]}])
  expect(outline.flatMap(file=>file.declarations.map(decl=>decl.name))).toEqual(['run'])
 })
 for(const code of ['void broken(){call(,);}','UNKNOWN_SCOPE\nvoid after(){}']) await source(code,async root=>{
  await expect(scanner.scan(root,{},['case.cpp'])).rejects.toThrow()
 })
})
