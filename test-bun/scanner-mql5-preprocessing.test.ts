import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import scanner from '../plugins/scanners/mql5/src/index.ts'

async function project(files: Record<string, string>, inspect: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-mql5-preprocessing-'))
  try {
    for (const [file, source] of Object.entries(files)) await writeFile(path.join(root, file), source)
    await inspect(root)
  } finally { await rm(root, { recursive: true, force: true }) }
}

test.concurrent('selected shared headers prove opaque macro syntax without expanding generated members or calls', async () => {
  const text = `// 😀
#include "Macros.h"
class Store {
public:
WRAP(int)
public:
void Save() {
PROFILE
ARRAY(unsigned char, bytes);
this MEMBER value = 1;
SELF value = 2;
value = Trace(Hidden());
value = Trace(Hidden())(Hidden());
Real();
}
};
`.replaceAll('\n', '\r\n')
  await project({ 'Macros.h': '#define WRAP(T) void Generated(T value) {}\n#define PROFILE Print("profile");\n#define ARRAY(T,N) T N[];\n#define MEMBER .\n#define SELF this.\n#define Trace(x) Print(x)\n', 'Store.mqh': text }, async root => {
    const selected = ['Macros.h', 'Store.mqh']
    expect(await scanner.listSourceFiles(root, {}, selected)).toEqual(selected)
    const result = (await scanner.scan(root, {}, selected))!
    expect(result.operations?.map(item => item.name)).toEqual(['Store::Save'])
    expect(result.invocations?.map(item => item.position)).toEqual([text.indexOf('Real()')])
    expect(result.diagnostics.some(item => item.code === 'MQL5_OPAQUE_MACRO')).toBe(true)
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Store.mqh', symbols: [] }], {}, selected)
    const store = file!.declarations.find(item => item.name === 'Store')!
    expect(store.kind === 'type' && store.members.map(item => item.name)).toEqual(['Save'])
    expect(await readFile(path.join(root, 'Store.mqh'), 'utf8')).toBe(text)
    await expect(scanner.scan(root, {}, ['Store.mqh'])).rejects.toThrow('MQL5')
  })
})

test.concurrent('macro-valued input labels preserve the literal function and physical locations', async () => {
  const text = '#define GROUP "Group"\n#define LABEL "Label"\ninput group GROUP\ninput(name=LABEL) bool Enabled=true;\nvoid OnTick() { Print(Enabled); }\n'
  await project({ 'Main.mq5': text }, async root => {
    const result = (await scanner.scan(root, {}, ['Main.mq5']))!
    expect(result.operations?.map(item => [item.name, item.position])).toEqual([['OnTick', text.indexOf('void OnTick')]])
    expect(result.invocations?.map(item => item.position)).toEqual([text.indexOf('Print')])
  })
})

test.concurrent('standard-library event maps stay opaque while source-written UI members remain visible', async () => {
  const text = `#include <Controls/Dialog.mqh>
class Panel { public: void Click() { Print("click"); } };
EVENT_MAP_BEGIN(Panel)
ON_EVENT(ON_CLICK, button, Click)
EVENT_MAP_END(CAppDialog)
void Work() { Print("work"); }
`
  await project({ 'Panel.mqh': text }, async root => {
    const result = (await scanner.scan(root, {}, ['Panel.mqh']))!
    expect(result.operations?.map(item => item.name).sort()).toEqual(['Panel::Click', 'Work'])
    expect(result.invocations).toHaveLength(2)
    expect(result.diagnostics.some(item => item.code === 'MQL5_OPAQUE_EVENT_MAP' && item.line === 3)).toBe(true)
  })
})

test.concurrent('conditional headers preserve following explicit methods without selecting a constructor or condition', async () => {
  const text = `class Database {
public:
#ifndef PLATFORM
Database(int flag=5) {
#else
Database(int flag=0) {
#endif
Hidden();
}
#ifdef PLATFORM
template<>
#endif
void Flush() { Print("flush"); }
void Run() {
#ifdef PLATFORM
if(flag>1) {
#else
if(true) {
#endif
Hidden();
} else { Hidden(); }
Print("run");
}
};
`
  await project({ 'Database.mqh': text }, async root => {
    const result = (await scanner.scan(root, {}, ['Database.mqh']))!
    expect(result.operations?.map(item => item.name)).toEqual(['Database::Flush', 'Database::Run'])
    expect(result.invocations?.map(item => item.position)).toEqual([text.indexOf('Print("flush")'), text.indexOf('Print("run")')])
    expect(result.entryPoints).toEqual([])
    expect(result.diagnostics.filter(item => item.code === 'MQL5_CONDITIONAL_SOURCE')).toHaveLength(3)
  })
})

test.concurrent('forward declarations before an include guard do not hide the actual type members', async () => {
  await project({ 'Trade.mqh': 'class Trade;\n#ifndef TRADE_MQH\n#define TRADE_MQH\nclass Trade { public: void Send() { Print("send"); } };\n#endif\n' }, async root => {
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Trade.mqh', symbols: [] }])
    const trade = file!.declarations.find(item => item.name === 'Trade')!
    expect(trade.kind === 'type' && trade.members.map(item => [item.name, item.line])).toEqual([['Send', 4]])
  })
})

test.concurrent('ordinary broken calls and unknown macro-shaped syntax remain failures', async () => {
  for (const source of ['void Work() { Print("missing semicolon") }', 'class Box { public: UNKNOWN(int)\nvoid Work() {} };', 'void Work() { this TYPO value = 1; }']) {
    await project({ 'Broken.mqh': source }, async root => {
      await expect(scanner.scan(root, {}, ['Broken.mqh'])).rejects.toThrow('MQL5')
    })
  }
})

test.concurrent('opaque control and parameter macros cannot provide calls or a function signature', async () => {
  const text = `#define EACH(n) int start=0; for(int i=0;i<n;++i)
#define KIND(S,E) E
void Uncertain(KIND(State,Enum) value) { Hidden(); }
void Work() { EACH(5) { Hidden(); } Visible(); }
`
  await project({ 'Macros.mqh': text }, async root => {
    const result = (await scanner.scan(root, {}, ['Macros.mqh']))!
    expect(result.operations?.map(item => item.name)).toEqual(['Work'])
    expect(result.invocations?.map(item => item.position)).toEqual([text.indexOf('Visible()')])
  })
})

test.concurrent('shared headers preserve conditional bases and qualifiers without exposing configured C++ types', async () => {
  const text = `#ifndef NATIVE
class color { public: color(unsigned int value) {} };
class datetime { public: datetime(const int& value); };
#endif
template<typename T> struct Candle
#ifndef NATIVE
: public Base
#endif
{
Candle(T value) { Save(value); }
#ifdef CPP
constexpr
#endif
static const T Get() { return 0; }
};
void Work() { color(Read()); datetime(Read()); }
`
  await project({ 'Shared.h': text }, async root => {
    const result = (await scanner.scan(root, {}, ['Shared.h']))!
    expect(result.operations?.map(item => item.name).sort()).toEqual(['Candle::Candle', 'Candle::Get', 'Work'])
    expect(result.invocations?.map(item => item.position!).sort((a, b) => a - b)).toEqual([
      text.indexOf('Save(value)'), text.indexOf('Read()'), text.lastIndexOf('Read()'),
    ])
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Shared.h', symbols: [] }])
    expect(file!.declarations.map(item => item.name)).toEqual(['Candle', 'Work'])
  })
})

test.concurrent('continued macro comments and final directives do not absorb the next declaration', async () => {
  const text = String.raw`#define BODY(x) \
  if (x) { /* first */ \
    Print(x); /* second */ \
  }
void Visible() { Print("visible"); }
#define LAST 1`
  await project({ 'Continued.h': text }, async root => {
    const result = (await scanner.scan(root, {}, ['Continued.h']))!
    expect(result.operations?.map(item => item.name)).toEqual(['Visible'])
    expect(result.invocations?.map(item => item.position)).toEqual([text.indexOf('Print("visible")')])
  })
})


test.concurrent('opaque member macros leave visibility unknown until a written access label', async () => {
  const text = `#define MEMBERS public:
#define SHIFT() }; class Generated {
class Direct {
MEMBERS;
void after() {}
public:
void certain() {}
};
class Conditional {
#ifdef FLAG
MEMBERS;
#endif
void after() {}
public:
void certain() { MEMBERS; }
void stillPublic() {}
};
class Boundary {
public:
void before() { Keep(); }
SHIFT();
public:
void wrong() { Hidden(); }
};
class ConditionalBoundary {
#ifdef FLAG
SHIFT();
#endif
public:
void wrong() { Hidden(); }
};
class Contained {
public:
void uncertain() { SHIFT(); Hidden(); }
void after() { Keep(); }
};
`
  await project({ 'Access.mqh': text }, async root => {
    const result = (await scanner.scan(root, {}, ['Access.mqh']))!
    expect(result.operations?.map(item => item.name).sort()).toEqual([
      'Boundary::before', 'Conditional::after', 'Conditional::certain', 'Conditional::stillPublic',
      'Contained::after', 'Contained::uncertain', 'Direct::after', 'Direct::certain',
    ])
    expect(result.invocations?.map(call => call.position)).toEqual([text.indexOf('Keep()'), text.lastIndexOf('Keep()')])
    expect(result.diagnostics.filter(item => item.code === 'MQL5_UNCERTAIN_OWNER').map(item => item.file)).toEqual(['Access.mqh', 'Access.mqh'])
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Access.mqh', symbols: [] }])
    expect(file!.declarations.map(type => type.kind === 'type' && [type.name, type.members.map(member => [member.name, member.visibility])])).toEqual([
      ['Direct', [['certain', 'public']]],
      ['Conditional', [['certain', 'public'], ['stillPublic', 'public']]],
      ['Boundary', [['before', 'public']]], ['ConditionalBoundary', []],
      ['Contained', [['uncertain', 'public'], ['after', 'public']]],
    ])
  })
})

test.concurrent('a placeholder cannot exceed the original macro span', async () => {
  await project({ 'Short.mqh': '#define X() if(true)\nvoid Work() { X() { Hidden(); } Visible(); }\n' }, async root => {
    await expect(scanner.scan(root, {}, ['Short.mqh'])).rejects.toThrow('MQL5_MACRO_SPAN_TOO_SHORT')
  })
})


test.concurrent('parseable macro handlers remain opaque when their definition is in a selected header', async () => {
  await project({
    'Defines.h': '#define OnTick() Renamed()\n',
    'Main.mq5': '#include "Defines.h"\nvoid OnTick() { Hidden(); }\nvoid Visible() { Print("visible"); }\n',
  }, async root => {
    const result = (await scanner.scan(root, {}, ['Defines.h', 'Main.mq5']))!
    expect(result.operations?.map(item => item.name)).toEqual(['Visible'])
    expect(result.entryPoints).toEqual([])
    expect(result.diagnostics.some(item => item.code === 'MQL5_OPAQUE_MACRO' && item.file === 'Main.mq5' && item.line === 2)).toBe(true)
  })
})


test.concurrent('unrelated version metadata preserves a proven owning-file event entry', async () => {
  await project({
    'Main.mq5': '#define VERSION "1.0"\n#property version VERSION\n#include "Panel.mqh"\nvoid OnTick() { Refresh(); }\n',
    'Panel.mqh': 'void Refresh() {}\n',
  }, async root => {
    const result = (await scanner.scan(root, {}, ['Main.mq5', 'Panel.mqh']))!
    expect(result.entryPoints?.map(entry => [entry.file, entry.files])).toEqual([['Main.mq5', ['Main.mq5']]])
  })
})


test.concurrent('macros that change brace scope cannot give later calls the apparent outer caller', async () => {
  const ordinary = '#define OPEN() } void generated() {\n#define CLOSE() } void tail() {\n#define GLUE(a,b) a##b\n'
  const mixed = '#ifdef FLAG\n#define OPEN } void generated() { if\n#else\n#define OPEN(x)\n#endif\n'
  for (const [definitions, opening, closing] of [
    [ordinary, 'OPEN()', 'CLOSE();'], [ordinary, 'GLUE(OP, EN)()', ''], [mixed, 'OPEN(1)', ''],
  ]) {
    const text = `${definitions}void hidden() {}
void after() {}
void outer() {
${opening};
hidden();
${closing}
after();
}
void certain() { after(); }
`
    await project({ 'Boundary.mqh': text }, async root => {
      const result = (await scanner.scan(root, {}, ['Boundary.mqh']))!
      expect(result.operations?.map(item => item.name).sort()).toEqual(['after', 'certain', 'hidden', 'outer'])
      const certain = result.operations!.find(item => item.name === 'certain')!
      expect(result.invocations?.map(call => [call.source, call.position])).toEqual([[certain.id, text.lastIndexOf('after()')]])
      const macroLine = text.slice(0, text.indexOf(`${opening};`)).split('\n').length
      expect(result.diagnostics.some(item => item.code === 'MQL5_UNCERTAIN_CALLER' && item.file === 'Boundary.mqh' && item.line === macroLine)).toBe(true)
      const [file] = await scanner.readCodeStructure(root, [{ file: 'Boundary.mqh', symbols: [] }])
      expect(file!.declarations.map(item => item.name)).toEqual(['hidden', 'after', 'outer', 'certain'])
    })
  }
})

test.concurrent('backslash-before-comment continuation stays opaque and stops at the first ordinary newline', async () => {
  const text = String.raw`// 😀
#define DECL(T) \
class Generated { \
\    /// Opaque documentation.
void Hidden() {} \
};
DECL(int)
void Visible() { Print("visible"); }
#define LAST 1
// A normal comment containing \    /// does not continue LAST.
void After() { Print("after"); }
`.replaceAll('\n', '\r\n')
  await project({ 'Continued.mqh': text }, async root => {
    const result = (await scanner.scan(root, {}, ['Continued.mqh']))!
    expect(result.operations?.map(item => [item.name, item.position])).toEqual([
      ['Visible', text.indexOf('void Visible')], ['After', text.indexOf('void After')],
    ])
    expect(result.invocations?.map(item => item.position)).toEqual([text.indexOf('Print("visible")'), text.indexOf('Print("after")')])
    expect(result.diagnostics.some(item => item.code === 'MQL5_OBSERVED_MACRO_CONTINUATION' && item.line === 2)).toBe(true)
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Continued.mqh', symbols: [] }])
    expect(file!.declarations.map(item => [item.name, item.line])).toEqual([['Visible', 8], ['After', 11]])
  })
  for (const text of [
    String.raw`#define VALUE 1
\   /// outside the definition
void Visible() { Print("visible"); }`,
    String.raw`#define DECL(T) \
class Generated { \
/// not continued
void Hidden() {} \
};`,
    String.raw`#define DECL(T) \
\   ordinary_tokens
void Broken() { Print("missing semicolon") }`,
  ]) await project({ 'Broken.mqh': text }, async root => {
    await expect(scanner.scan(root, {}, ['Broken.mqh'])).rejects.toThrow('MQL5')
  })
})

test.concurrent('selected shared DLL signature wrappers stay opaque without choosing their native branch', async () => {
  const definitions = `#ifdef NATIVE
#define API(type) extern "C" __declspec(dllexport) type __stdcall
#define OUT(name) *name
#else
#define API(type) type
#define OUT(name) &name[]
#endif
`
  const text = 'API(void) Dependent(string OUT(buffer)) { Hidden(); }\nvoid Visible() { Print("visible"); }\n'
  await project({ 'Defs.h': definitions, 'Public.h': text }, async root => {
    const selected = ['Defs.h', 'Public.h']
    const result = (await scanner.scan(root, {}, selected))!
    expect(result.operations?.map(item => [item.name, item.position])).toEqual([['Visible', text.indexOf('void Visible')]])
    expect(result.invocations?.map(item => item.position)).toEqual([text.indexOf('Print')])
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Public.h', symbols: [] }], {}, selected)
    expect(file!.declarations.map(item => item.name)).toEqual(['Visible'])
    await expect(scanner.scan(root, {}, ['Public.h'])).rejects.toThrow('MQL5')
  })
  await project({ 'Other.h': '#define API(type) extern __declspec(unknown) type __stdcall\nAPI(void) Hidden();\n' }, async root => {
    await expect(scanner.scan(root, {}, ['Other.h'])).rejects.toThrow('MQL5')
  })
})

test.concurrent('selected pasted callable headers preserve adjacent literal members when selected pasted names cannot change scope', async () => {
  const definition = '#define HEADER(N) virtual bool case_##N(string &label)\n'
  const text = 'class Suite {\npublic:\nvoid Before() { Print("before"); }\nHEADER(1) { Hidden(); return true; }\npublic:\nvoid Visible() { Print("visible"); }\n};\n'
  await project({ 'Defs.h': definition, 'Suite.mqh': text }, async root => {
    const selected = ['Defs.h', 'Suite.mqh']
    const result = (await scanner.scan(root, {}, selected))!
    expect(result.operations?.sort((a, b) => a.position! - b.position!).map(item => [item.name, item.position])).toEqual([
      ['Suite::Before', text.indexOf('void Before')], ['Suite::Visible', text.indexOf('void Visible')],
    ])
    expect(result.invocations?.map(item => item.position!).sort((a, b) => a - b)).toEqual([text.indexOf('Print'), text.lastIndexOf('Print')])
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Suite.mqh', symbols: [] }], {}, selected)
    const suite = file!.declarations[0]!
    expect(suite.kind === 'type' && suite.members.map(item => [item.name, item.line, item.visibility])).toEqual([['Before', 3, 'public'], ['Visible', 6, 'public']])
    await expect(scanner.scan(root, {}, ['Suite.mqh'])).rejects.toThrow('MQL5')
  })
  await project({ 'Other.h': '#define HEADER(N) virtual bool case_##N(string &label) unexpected\nclass Suite { HEADER(1) { Hidden(); } };\n' }, async root => {
    await expect(scanner.scan(root, {}, ['Other.h'])).rejects.toThrow('MQL5')
  })
})

test.concurrent('a macro that escapes both method and type cannot assign later members to the written type', async () => {
  for (const [replacement, siblingKnown] of [
    ['} void generated() {', true],
    ['} }; class Generated { void generated() {', false],
  ] as const) {
    const text = `#define SHIFT() ${replacement}
class Written {
public:
void before() { Keep(); }
void first() { SHIFT(); Hidden(); }
void second() { Keep(); }
};
`
    await project({ 'Escape.mqh': text }, async root => {
      const result = (await scanner.scan(root, {}, ['Escape.mqh']))!
      const names = ['Written::before', 'Written::first', ...(siblingKnown ? ['Written::second'] : [])]
      expect(result.operations?.map(item => item.name).sort()).toEqual([...names].sort())
      expect(result.invocations?.map(item => item.position!).sort((a, b) => a - b)).toEqual([text.indexOf('Keep()'), ...(siblingKnown ? [text.lastIndexOf('Keep()')] : [])])
      const [file] = await scanner.readCodeStructure(root, [{ file: 'Escape.mqh', symbols: [] }])
      expect(file!.declarations.map(type => type.kind === 'type' && [type.name, type.members.map(item => [item.name, item.visibility])])).toEqual([
        ['Written', names.map(name => [name.split('::')[1], 'public'])],
      ])
      expect(result.diagnostics.some(item => item.code === 'MQL5_UNCERTAIN_OWNER' && item.line === 5)).toBe(!siblingKnown)
    })
  }
})


test.concurrent('one-formal fixed paste boundaries preserve literal scopes only when every matching selected name is contained', async () => {
  const fixed = '#define CHECK(N) if (_pool_##N##d == 0) { _pool_##N##d = 1; }\n'
  const safe = '#ifdef FLAG\n#define _pool_otherd value\n#else\n#define _pool_otherd { value; }\n#endif\n'
  const unsafe = '#ifdef FLAG\n#define _pool_d value\n#else\n#define _pool_d } }; class Generated { void generated() {\n#endif\n'
  for (const [definitions, invocation, contained] of [
    [fixed + safe, 'CHECK(1)', true],
    [fixed + unsafe, 'CHECK()', false],
    [`${fixed}#define _pool_loopd _pool_loopd\n`, 'CHECK(loop)', false],
    ['#define CHECK(A,B) A##B\n', 'CHECK(unknown,name)', false],
    ['#define CHECK(N) N##+\n', 'CHECK(1)', false],
  ] as const) {
    const text = `${definitions}class Written {
public:
void before() { Keep(); }
void first() { ${invocation}; Visible(); }
void after() { Keep(); }
};
`
    await project({ 'Paste.mqh': text }, async root => {
      const result = (await scanner.scan(root, {}, ['Paste.mqh']))!
      const names = ['Written::before', 'Written::first', ...(contained ? ['Written::after'] : [])]
      expect(result.operations?.map(item => item.name).sort()).toEqual([...names].sort())
      expect(result.invocations?.map(item => item.position!).sort((a, b) => a - b)).toEqual([
        text.indexOf('Keep()'), ...(contained ? [text.indexOf('Visible()'), text.lastIndexOf('Keep()')] : []),
      ])
      const [file] = await scanner.readCodeStructure(root, [{ file: 'Paste.mqh', symbols: [] }])
      const type = file!.declarations[0]!
      expect(type.kind === 'type' && type.members.map(item => [item.name, item.visibility])).toEqual(names.map(name => [name.split('::')[1], 'public']))
      expect(result.diagnostics.some(item => item.code === 'MQL5_UNCERTAIN_OWNER')).toBe(!contained)
    })
  }
})


test.concurrent('quoted markers and real comments preserve following directive boundaries', async () => {
  const literal = String.raw`"/*stdin*\\"`
  for (const [value, middleLine] of [
    [literal, 3], [`(${literal})`, 3], [`"prefix" ${literal}`, 3],
    ["1 // Don't hide normal code", 3], [String.raw`1 /* real comment */ \
 + 2`, 4],
  ] as const) {
    const text = `void before() {}
#define STRINGMARK ${value}
void middle() { before(); }
/* a real comment */
void after() { before(); }
`
    await project({ 'Quoted.mqh': text }, async root => {
      const result = (await scanner.scan(root, {}, ['Quoted.mqh']))!
      expect(result.operations?.sort((a, b) => a.position! - b.position!).map(item => [item.name, item.position])).toEqual([
        ['before', text.indexOf('void before')], ['middle', text.indexOf('void middle')], ['after', text.indexOf('void after')],
      ])
      expect(result.invocations?.map(item => item.position!).sort((a, b) => a - b)).toEqual([text.indexOf('before();'), text.lastIndexOf('before();')])
      const [file] = await scanner.readCodeStructure(root, [{ file: 'Quoted.mqh', symbols: [] }])
      expect(file!.declarations.map(item => [item.name, item.line])).toEqual([['before', 1], ['middle', middleLine], ['after', middleLine + 2]])
    })
  }
})
