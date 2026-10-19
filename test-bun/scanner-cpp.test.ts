import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import scanner from '../plugins/scanners/cpp/src/index.ts'

async function fixture(run: (root: string, files: string[]) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-cpp-'))
  const files = ['api.hpp', 'api.cpp']
  try {
    for (const file of files) await writeFile(path.join(root, file),
      await readFile(new URL(`../test/fixtures/cpp-source/${file}.fixture`, import.meta.url)))
    await run(root, files)
  } finally { await rm(root, { recursive: true, force: true }) }
}

test.concurrent('C++ outlines declarations in source order with language access and exact name lines', () => fixture(async (root, files) => {
  const [outline] = await scanner.readCodeStructure(root, [{ file: 'api.hpp', symbols: ['Service', 'run'] }], {}, files)
  expect(outline!.declarations.map(value => value.name)).toEqual(['Mode', 'Service', 'Record', 'Box', 'helper', 'forward'])
  const service = outline!.declarations.find(value => value.name === 'Service')!
  expect(service.kind).toBe('type')
  if (service.kind !== 'type') throw new Error('Expected Service type')
  expect(service.entry).toBe(true)
  expect(service.members.map(value => [value.name, value.visibility, value.entry])).toEqual([
    ['Service', 'public', false], ['~Service', 'public', false], ['run', 'public', true], ['run', 'public', true],
    ['stop', 'protected', false], ['secret', 'private', false],
  ])
  expect(service.members.map(value => value.line)).toEqual([6, 7, 8, 9, 11, 14])
  expect(outline!.declarations.find(value => value.name === 'helper')!.visibility).toBe('private')
  const record = outline!.declarations.find(value => value.name === 'Record')!
  expect(record.kind === 'type' && record.members.map(value => value.visibility)).toEqual(['public', 'private'])
}))

test.concurrent('C++ separate definitions use selected declaration access, without inventing missing class context', () => fixture(async (root, files) => {
  const references = [{ file: 'api.cpp', symbols: ['Service', 'stop'] }]
  const [outline] = await scanner.readCodeStructure(root, references, {}, files)
  const service = outline!.declarations.find(value => value.name === 'Service')!
  expect(service.kind === 'type' && service.members.map(value => [value.name, value.visibility, value.line])).toEqual([
    ['Service', 'public', 3], ['~Service', 'public', 4], ['run', 'public', 5], ['stop', 'protected', 14], ['secret', 'private', 15],
  ])
  expect(service.entry).toBe(true)
  expect(service.kind === 'type' && service.members.filter(member => member.entry).map(member => member.name)).toEqual(['stop'])
  expect(outline!.declarations.find(value => value.name === 'fileOnly')!.visibility).toBe('private')
  expect(outline!.declarations.some(value => value.name === 'topLambda' && value.kind === 'function')).toBe(true)
  const [withoutHeader] = await scanner.readCodeStructure(root, references)
  expect(withoutHeader!.declarations.some(value => value.name === 'Service')).toBe(false)
}))

test.concurrent('C++ evidence keeps real caller ownership and UTF-16 positions, without guessed overload targets', () => fixture(async (root, files) => {
  const before = await Promise.all(files.map(file => readFile(path.join(root, file), 'utf8')))
  const scan = (await scanner.scan(root, {}, files))!
  const run = scan.operations!.find(operation => operation.name === 'app::Service::run')!
  expect(run.position).toBe(before[1]!.indexOf('void app::Service::run'))
  const calls = scan.invocations!.filter(call => call.source === run.id)
  expect(calls.map(call => call.member)).toEqual(['emit', 'captureValue', 'record.save'])
  expect(calls[0]!.position).toBe(before[1]!.indexOf('emit(value)'))
  expect(scan.operations!.some(operation => operation.name.endsWith('Local::own'))).toBe(true)
  expect(scan.invocations!.find(call => call.member === 'localCall')!.source).not.toBe(run.id)
  expect(scan.invocations!.some(call => call.member === 'makeCounter')).toBe(true)
  expect(scan.invocations!.every(call => call.unresolved && call.targets.length === 0)).toBe(true)
  expect(scan.operations!.some(operation => operation.name === 'app::forward')).toBe(false)
  expect(scan.operations!.every(operation => operation.tokens === undefined)).toBe(true)
  expect(scan.entryPoints).toBeUndefined()
  expect(scan.diagnostics.some(diagnostic => diagnostic.code === 'CPP_CONDITIONAL_SOURCE')).toBe(true)
  expect(await scanner.scan(root, {}, [...files].reverse())).toEqual(scan)
  expect(await Promise.all(files.map(file => readFile(path.join(root, file), 'utf8')))).toEqual(before)
}))

test.concurrent('C++ checks only selected sources and reports concrete parser failures', () => fixture(async (root) => {
  await writeFile(path.join(root, 'invalid.cpp'), 'void broken( {')
  expect(await scanner.listSourceFiles(root, {}, ['api.hpp', 'other.txt', 'api.hpp'])).toEqual(['api.hpp'])
  expect((await scanner.scan(root, {}, ['api.hpp']))!.files.map(file => file.file)).toEqual(['api.hpp'])
  await expect(scanner.scan(root, {}, ['invalid.cpp'])).rejects.toThrow('invalid.cpp:1:')
  await expect(scanner.checkReadiness(root, {}, ['invalid.cpp'])).rejects.toThrow('invalid.cpp:1:')
}))

test.concurrent('C++ conditional access never leaks from one alternative into another or past the condition', () => fixture(async root => {
  await writeFile(path.join(root, 'access.hpp'), `class Access {
#if FEATURE
public:
void first();
#else
void second();
#endif
void ambiguous();
protected:
void last();
};
#define CHECK(x) 1
void run() {
#if CHECK(1)
  work();
#elif CHECK(2)
  other();
#endif
}
`)
  const [outline] = await scanner.readCodeStructure(root, [{ file: 'access.hpp', symbols: [] }])
  const type = outline!.declarations[0]!
  expect(type.kind === 'type' && type.members.map(member => [member.name, member.visibility])).toEqual([
    ['first', 'public'], ['second', 'private'], ['last', 'protected'],
  ])
  const scan = (await scanner.scan(root, {}, ['access.hpp']))!
  expect(scan.invocations!.map(call => call.member)).toEqual(['work', 'other'])
}))


test.concurrent('C++ friend functions are not class members and static named lambdas remain file-local', () => fixture(async root => {
  await writeFile(path.join(root, 'friends.cpp'), `class Value {
  friend void friendBody() { target(); }
  void own() {}
};
static auto callback = [] { call(); };
constexpr auto constant = [] { call(); };
inline constexpr auto shared = [] { call(); };
`)
  const [outline] = await scanner.readCodeStructure(root, [{ file: 'friends.cpp', symbols: [] }])
  const type = outline!.declarations[0]!
  expect(type.kind === 'type' && type.members.map(member => member.name)).toEqual(['own'])
  expect(outline!.declarations.filter(value => value.kind === 'function').map(value => [value.name, value.visibility])).toEqual([
    ['callback', 'private'], ['constant', 'private'], ['shared', 'public'],
  ])
  const scan = (await scanner.scan(root, {}, ['friends.cpp']))!
  expect(scan.operations!.find(operation => operation.name === 'friendBody')).toBeDefined()
}))


test.concurrent('C++ out-of-line conversion operators retain implementation evidence and their type outline', () => fixture(async root => {
  await writeFile(path.join(root, 'conversion.cpp'), `struct Value { operator bool() const; operator const std::string& () const noexcept; };
Value::operator bool() const { return probe(); }
Value::operator const std::string & () const noexcept { return text; }
`)
  const scan = (await scanner.scan(root, {}, ['conversion.cpp']))!
  const operation = scan.operations!.find(value => value.name === 'Value::operator bool')
  expect(operation).toBeDefined()
  expect(scan.invocations!.find(call => call.member === 'probe')!.source).toBe(operation!.id)
  expect(scan.operations!.map(value => value.name).sort()).toEqual(['Value::operator bool', 'Value::operator const std::string&'])
  const [outline] = await scanner.readCodeStructure(root, [{ file: 'conversion.cpp', symbols: [] }])
  const type = outline!.declarations[0]!
  expect(type.kind === 'type' && type.members.map(member => [member.name, member.line])).toEqual([
    ['operator bool', 1], ['operator const std::string&', 1], ['operator bool', 2], ['operator const std::string&', 3],
  ])
}))


test.concurrent('C++ operator declarations and definitions share identity across token spacing', () => fixture(async root => {
  await writeFile(path.join(root, 'spacing.cpp'), `struct Formatted { Formatted& operator=(const Formatted&); };
Formatted& Formatted::operator = (const Formatted& value) { return *this; }
`)
  const [outline] = await scanner.readCodeStructure(root, [{ file: 'spacing.cpp', symbols: ['operator='] }])
  const type = outline!.declarations[0]!
  expect(type.kind === 'type' && type.members.map(member => [member.name, member.line, member.entry])).toEqual([
    ['operator=', 1, true], ['operator=', 2, true],
  ])
}))

test.concurrent('C++ same-file static declarations preserve private linkage without guessing other overloads or branches', () => fixture(async root => {
  await writeFile(path.join(root, 'linkage.cpp'), `static void internal();
void internal() {}
static void overloaded(int value);
void overloaded(double value) {}
#if FEATURE
static void conditional();
#endif
void conditional() {}
namespace { void distinct(); }
void distinct() {}
`)
  const [outline] = await scanner.readCodeStructure(root, [{ file: 'linkage.cpp', symbols: [] }])
  expect(outline!.declarations.map(value => [value.name, value.line, value.visibility])).toEqual([
    ['internal', 1, 'private'], ['internal', 2, 'private'], ['overloaded', 3, 'private'],
    ['conditional', 6, 'private'], ['distinct', 9, 'private'], ['distinct', 10, 'public'],
  ])
}))

test.concurrent('C++ anonymous-namespace member definitions use only their own file-local type', () => fixture(async root => {
  const files = ['local_a.cpp', 'local_b.cpp']
  for (const [index, file] of files.entries()) await writeFile(path.join(root, file), `namespace {
class Local { ${index === 0 ? 'public' : 'private'}: void run(); };
void Local::run() {}
}
`)
  const outlines = await scanner.readCodeStructure(root, files.map(file => ({ file, symbols: [] })), {}, files)
  expect(outlines.map(outline => {
    const type = outline.declarations[0]!
    return type.kind === 'type' && type.members.map(member => [member.line, member.visibility])
  })).toEqual([[[2, 'public'], [3, 'public']], [[2, 'private'], [3, 'private']]])
}))


test.concurrent('C++ standard comma, pointer-array and preprocessor syntax keeps source evidence', () => fixture(async root => {
  await writeFile(path.join(root, 'standard.cpp'), `# // A comment after a null directive.
#if __has_cpp_attribute(clang::fallthrough)
void consume(int*);
#endif
void run(bool condition, int count) {
  int value;
  consume(condition ? (value = 1, &value) : nullptr);
  int** entries = new int*[count];
  delete[] entries;
}
`)
  const scan = (await scanner.scan(root, {}, ['standard.cpp']))!
  expect(scan.operations!.map(operation => operation.name)).toEqual(['run'])
  expect(scan.invocations!.map(call => [call.member, call.line])).toEqual([['consume', 7], ['int', 8]])
  const [outline] = await scanner.readCodeStructure(root, [{ file: 'standard.cpp', symbols: [] }])
  expect(outline!.declarations.map(value => [value.name, value.line])).toEqual([['consume', 3], ['run', 5]])
}))


test.concurrent('C++ separate overloads use known parameter counts without guessing equal-count access', () => fixture(async root => {
  const source = `class Parser {
public:
  Parser(bool enabled = true, int mode = 0);
  void parse(const char* text, int length = 0);
  void same(int value);
private:
  Parser(const Parser&);
  void parse();
  void same(double value);
};
Parser::Parser(bool enabled, int mode) {}
Parser::Parser(const Parser& other) {}
void Parser::parse(const char* text, int length) {}
void Parser::parse() {}
void Parser::same(int value) {}
void Parser::same(double value) {}
`
  await writeFile(path.join(root, 'overloads.cpp'), source)
  const [outline] = await scanner.readCodeStructure(root, [{ file: 'overloads.cpp', symbols: [] }])
  const type = outline!.declarations[0]!
  expect(type.kind === 'type' && type.members.filter(member => member.line > 10).map(member => [member.name, member.line, member.visibility])).toEqual([
    ['Parser', 11, 'public'], ['Parser', 12, 'private'], ['parse', 13, 'public'], ['parse', 14, 'private'],
  ])
  const scan = (await scanner.scan(root, {}, ['overloads.cpp']))!
  expect(scan.operations!.length).toBe(6)
  expect(scan.operations!.find(operation => operation.name === 'Parser::parse')!.position).toBe(source.indexOf('void Parser::parse'))
}))
