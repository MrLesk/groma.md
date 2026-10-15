import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import scanner from '../plugins/scanners/mql5/src/index.ts'

async function project(files: Record<string, string | Buffer>, inspect: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'groma-mql5-'))
  try {
    for (const [file, source] of Object.entries(files)) await writeFile(path.join(root, file), source)
    await inspect(root)
  } finally { await rm(root, { recursive: true, force: true }) }
}

const fixture = path.resolve(import.meta.dir, '../test/fixtures/mql5-source/Example.mq5.fixture')

test.concurrent('MQL5 declarations preserve language access, source order and exact Code entries', async () => {
  const text = await readFile(fixture, 'utf8')
  await project({ 'Example.mq5': text }, async root => {
    const observation = await scanner.scan(root, {}, ['Example.mq5'])
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Example.mq5', symbols: ['CStrategy', 'State::Reset'] }])
    const strategy = file!.declarations.find(item => item.name === 'CStrategy')!
    expect(strategy.kind).toBe('type')
    if (strategy.kind !== 'type') throw new Error('Missing type')
    expect(strategy.members.map(member => [member.name, member.visibility])).toEqual([
      ['Hidden', 'private'], ['Probe', 'protected'], ['CStrategy', 'public'], ['~CStrategy', 'public'], ['Compute', 'public'], ['Probe', 'protected'],
    ])
    expect(strategy.entry).toBe(true)
    expect(strategy.members.every(member => !member.entry)).toBe(true)
    const state = file!.declarations.find(item => item.name === 'State')!
    expect(state.kind === 'type' && state.members[0]).toMatchObject({ name: 'Reset', visibility: 'public', entry: true })
    const iface = file!.declarations.find(item => item.name === 'ILogger')!
    expect(iface.kind === 'type' && iface.members[0]?.visibility).toBe('public')
    expect(file!.declarations.map(item => item.line)).toEqual([...file!.declarations.map(item => item.line)].sort((a, b) => a - b))
    const onTick = observation!.operations!.find(item => item.name === 'OnTick')!
    expect(onTick.position).toBe(text.indexOf('void OnTick'))
    expect(observation!.invocations!.find(call => call.source === onTick.id)).toMatchObject({ targets: [], unresolved: true, position: text.indexOf('Helper(Length)') })
    expect(observation!.operations!.some(item => item.name === 'ILogger::Write')).toBe(false)
    expect(observation!.entryPoints).toEqual([{ file: 'Example.mq5', declaration: 'Example.mq5', name: 'Example', files: ['Example.mq5'] }])
    expect(await scanner.scan(root, {}, ['Example.mq5'])).toEqual(observation)
    expect(await readFile(path.join(root, 'Example.mq5'), 'utf8')).toBe(text)
  })
})

test.concurrent('selected header declarations prove out-of-class access without loading includes', async () => {
  await project({
    'Types.mqh': '#ifndef TYPES\n#define TYPES\nclass Base { protected: void Run(); };\n#endif\n',
    'Main.mq5': '#include "Types.mqh"\nvoid Base::Run() { Print("run"); }\nvoid Unknown::Run() {}\n',
    'Unselected.mqh': 'broken source {',
  }, async root => {
    expect(await scanner.listSourceFiles(root, {}, ['Main.mq5', 'Types.mqh', 'script.mq4', 'out.ex5'])).toEqual(['Main.mq5', 'Types.mqh'])
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Main.mq5', symbols: ['Base::Run'] }], {}, ['Main.mq5', 'Types.mqh'])
    expect(file!.declarations).toEqual([{ kind: 'type', name: 'Base', line: 2, visibility: 'public', entry: false,
      members: [{ name: 'Run', line: 2, visibility: 'protected', entry: true }] }])
    expect(await scanner.readCodeStructure(root, [{ file: 'Main.mq5', symbols: [] }])).toEqual([])
    const result = await scanner.scan(root, {}, ['Main.mq5', 'Types.mqh'])
    expect(result!.files.map(file => file.file)).toEqual(['Main.mq5', 'Types.mqh'])
    expect(result!.operations!.some(operation => operation.name === 'Unknown::Run')).toBe(true)
  })
})

test.concurrent('UTF-16 source and astral text keep physical names, operation offsets and call ownership', async () => {
  const text = '\ufeff// 😀\r\nvoid\r\nOnStart(void) { string x="😀"; Print(x); }\r\n'
  await project({ 'Unicode.mq5': Buffer.from(text, 'utf16le') }, async root => {
    const result = await scanner.scan(root, {}, ['Unicode.mq5'])
    expect(result!.operations![0]!.position).toBe(text.indexOf('void'))
    expect(result!.invocations![0]!.position).toBe(text.indexOf('Print'))
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Unicode.mq5', symbols: ['OnStart'] }])
    expect(file!.declarations[0]).toMatchObject({ name: 'OnStart', line: 3, entry: true })
    expect(result!.entryPoints).toHaveLength(1)
  })
})

test.concurrent('conditional declarations and calls are not fabricated and event signatures are checked', async () => {
  await project({
    'Branch.mq5': '#ifdef CHOICE\nvoid Conditional() {}\n#endif\nvoid OnTick() {\n#ifdef CHOICE\nConditional();\n#endif\nPrint("tick"); }\n',
    'Wrong.mq5': 'void OnTick(int argument) { Print(argument); }',
    'Library.mq5': '#property library\nvoid OnStart() { Print("library"); }',
    'Header.mqh': 'void OnStart() {}',
    'Conflicting.mq5': 'void OnStart() {} void OnTick() {}',
    'Overloaded.mq5': 'void OnTick() {} int OnTick(int value) { return value; }',
    'Template.mq5': 'template<typename T> void OnTick() {}',
    'Macro.mq5': '#define OnTick Alias\nvoid OnTick() {}',
  }, async root => {
    const result = await scanner.scan(root, {}, ['Branch.mq5', 'Wrong.mq5', 'Library.mq5', 'Header.mqh', 'Conflicting.mq5', 'Overloaded.mq5', 'Template.mq5', 'Macro.mq5'])
    expect(result!.entryPoints).toEqual([])
    expect(result!.operations!.some(operation => operation.name === 'Conditional')).toBe(false)
    // The selected Macro.mq5 can replace OnTick; inspect ordinary branch ownership without that definition.
    const branch = (await scanner.scan(root, {}, ['Branch.mq5']))!
    const caller = branch.operations!.find(operation => operation.file === 'Branch.mq5')!
    expect(branch.invocations!.filter(call => call.source === caller.id)).toHaveLength(1)
    expect(result!.diagnostics.filter(diagnostic => diagnostic.code === 'MQL5_CONDITIONAL_SOURCE').map(item => item.line)).toEqual([1, 5])
  })
})

test.concurrent('conditional access and nested types do not add outline members or operations', async () => {
  await project({ 'Types.mqh': `class Outer {
#ifdef PUBLIC
public:
#endif
void Uncertain() {}
public:
void Certain() {}
class Inner { public: void Nested() { Print("nested"); } };
};
` }, async root => {
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Types.mqh', symbols: [] }])
    expect(file!.declarations).toHaveLength(1)
    const outer = file!.declarations[0]!
    expect(outer.kind === 'type' && outer.members.map(member => member.name)).toEqual(['Certain'])
    const result = await scanner.scan(root, {}, ['Types.mqh'])
    expect(result!.operations!.map(operation => operation.name)).toEqual(['Outer::Uncertain', 'Outer::Certain'])
    expect(result!.invocations).toEqual([])
  })
})

test.concurrent('parser errors fail the whole request with a physical source location', async () => {
  await project({ 'Good.mq5': 'void OnStart() {}', 'Bad.mqh': 'class Broken { void Run(;' }, async root => {
    await expect(scanner.scan(root, {}, ['Good.mq5', 'Bad.mqh'])).rejects.toThrow('MQL5_PARSE_ERROR: Bad.mqh:1:')
    await expect(scanner.readCodeStructure(root, [{ file: 'Bad.mqh', symbols: [] }])).rejects.toThrow('MQL5_PARSE_ERROR: Bad.mqh:1:')
  })
})

test.concurrent('ordinary MQL5 type expressions and named inputs parse in their source context', async () => {
  await project({
    'Type.mqh': 'template<typename T> T Identity(T value) { if (typename(T) == "datetime") return value; return value; }',
    'Cast.mq5': 'void OnStart() { if (long(1.5) == 1) Print("one"); }',
    'Input.mq5': 'input(name="Show label") bool ShowLabel = true; void OnTick() { Print(ShowLabel); }',
  }, async root => {
    for (const [file, name] of [['Type.mqh', 'Identity'], ['Cast.mq5', 'OnStart'], ['Input.mq5', 'OnTick']]) {
      const result = await scanner.scan(root, {}, [file!])
      expect(result!.operations!.map(operation => operation.name)).toEqual([name!])
    }
  })
})

test.concurrent('typename and primitive conversions are operators, with nested calls preserved', async () => {
  const text = `template<typename T> string TypeName(const T &value) { return typename(T); }
double ReadValue() { return 1.5; }
void OnStart() { Print(int(ReadValue()), bool(1), string(2), uchar(3)); }
`
  await project({ 'Operators.mq5': text }, async root => {
    const result = await scanner.scan(root, {}, ['Operators.mq5'])
    const caller = result!.operations!.find(operation => operation.name === 'OnStart')!
    expect(result!.invocations!.map(call => [call.source, call.position])).toEqual([
      [caller.id, text.indexOf('Print(')], [caller.id, text.lastIndexOf('ReadValue(')],
    ])
  })
})

test.concurrent('comments in empty and void parameter lists preserve event entries', async () => {
  await project({
    'Start.mq5': 'void OnStart(/* no arguments */) { Print("start"); }',
    'Tick.mq5': 'void OnTick(void /* no arguments */) { Print("tick"); }',
  }, async root => {
    const result = await scanner.scan(root, {}, ['Start.mq5', 'Tick.mq5'])
    expect(result!.entryPoints!.map(entry => entry.file)).toEqual(['Start.mq5', 'Tick.mq5'])
  })
})


test.concurrent('conditional array initializers retain surrounding evidence without selecting a branch', async () => {
  const text = `\ufeffstruct Error { int code; string message; };
Error errors[] = {
#ifdef __MQL5__
 {0,"ok"},
#else
 {1,"other"},
#endif
};
void Work() { Print("work"); }
`
  await project({ 'Error.mqh': Buffer.from(text, 'utf16le') }, async root => {
    const result = await scanner.scan(root, {}, ['Error.mqh'])
    expect(result!.operations!.map(operation => operation.name)).toEqual(['Work'])
    expect(result!.invocations!.map(call => call.position)).toEqual([text.indexOf('Print(')])
    expect(result!.diagnostics.filter(diagnostic => diagnostic.code === 'MQL5_CONDITIONAL_SOURCE').map(item => item.line)).toEqual([3])
  })
})


test.concurrent('void-prefixed MQL5 constructors and destructors keep declarations and operations', async () => {
  const text = 'struct Box {\n int value;\n void Box(int number): value(number) {}\n void ~Box() { Print(1); }\n};'
  await project({ 'Box.mqh': text }, async root => {
    const result = await scanner.scan(root, {}, ['Box.mqh'])
    expect(result!.operations!.map(operation => [operation.name, operation.position])).toEqual([
      ['Box::Box', text.indexOf('void Box')], ['Box::~Box', text.indexOf('void ~Box')],
    ])
    const destructor = result!.operations!.find(operation => operation.name === 'Box::~Box')!
    expect(result!.invocations!.map(call => [call.source, call.position])).toEqual([[destructor.id, text.indexOf('Print(')]])
    const [file] = await scanner.readCodeStructure(root, [{ file: 'Box.mqh', symbols: ['Box::Box'] }])
    const type = file!.declarations[0]!
    expect(type.kind === 'type' && type.members).toEqual([
      { name: 'Box', line: 3, visibility: 'public', entry: true },
      { name: '~Box', line: 4, visibility: 'public', entry: false },
    ])
  })
})

test.concurrent('MQL5 this assignment preserves the owning constructor without inventing calls', async () => {
  await project({ 'Box.mqh': 'class Box { public: int value; Box() {} Box(const Box &other) { this = other; } };' }, async root => {
    const result = await scanner.scan(root, {}, ['Box.mqh'])
    expect(result!.operations!.map(operation => operation.name)).toEqual(['Box::Box', 'Box::Box'])
    expect(result!.invocations).toEqual([])
  })
})

test.concurrent('conditional parameters preserve unconditional bodies without proving event signatures', async () => {
  await project({
    'Value.mqh': `double Value(
#ifdef VERSION4
 int mode,
#else
 double mode,
#endif
 int shift=0) { return mode+shift; }
void Work() { Print("work"); }
`,
    'Event.mq5': `void OnTick(
#ifdef HAS_ARGUMENT
 int mode
#else
 void
#endif
) { Print("tick"); }
`,
  }, async root => {
    const result = await scanner.scan(root, {}, ['Value.mqh', 'Event.mq5'])
    expect(result!.operations!.map(operation => operation.name)).toEqual(['OnTick', 'Value', 'Work'])
    expect(result!.entryPoints).toEqual([])
    expect(result!.invocations!.map(call => result!.operations!.find(operation => operation.id === call.source)!.name)).toEqual(['OnTick', 'Work'])
    expect(result!.diagnostics.filter(diagnostic => diagnostic.code === 'MQL5_CONDITIONAL_SOURCE').map(item => [item.file, item.line])).toEqual([['Event.mq5', 2], ['Value.mqh', 2]])
  })
})
