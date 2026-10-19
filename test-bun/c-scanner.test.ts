import { expect, test } from 'bun:test'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ScannerPlugin, ScanObservation } from '@groma/scanner'
import { buildPackage } from '../plugins/scanners/c/build.ts'

const fixture = path.resolve(import.meta.dir, '../test/fixtures/c-source')

function verifyCalls(observation: ScanObservation, source: string): void {
  const operations = observation.operations!
  expect(operations.find(operation => operation.name === 'hidden')!.position).toBe(source.indexOf('int hidden(int value) {'))
  const run = operations.find(operation => operation.name === 'run')!
  const nested = operations.find(operation => operation.name === 'nested')!
  expect(observation.invocations!.filter(call => call.source === run.id).map(call => call.member))
    .toEqual(['callback', 'dispatch', undefined, 'nested'])
  expect(observation.invocations!.filter(call => call.source === nested.id).map(call => call.member)).toEqual(['only_nested'])
  expect(observation.invocations!.find(call => call.member === 'dispatch'))
    .toMatchObject({ line: 12, position: source.indexOf('service->dispatch') })
  const configured = operations.find(operation => operation.name === 'configured')!
  expect(observation.invocations!.filter(call => call.source === configured.id).map(call => call.member))
    .toEqual(['if_work', 'elif_work', 'else_work'])
  expect(observation.invocations!.every(call => call.unresolved && call.targets.length === 0)).toBeTrue()
  expect(operations.map(operation => operation.name)).toContain('factory')
  expect(observation.entryPoints).toBeUndefined()
}

async function verifyOutline(scanner: ScannerPlugin): Promise<void> {
  const outlines = await scanner.readCodeStructure!(fixture, [
    { file: 'worker.c', symbols: ['run'] }, { file: 'api.h', symbols: ['Service'] },
  ])
  const worker = outlines[0]!.declarations
  expect(worker.filter(item => item.name === 'hidden').map(item => [item.line, item.visibility]))
    .toEqual([[4, 'private'], [5, 'private'], [6, 'private']])
  expect(worker.filter(item => item.name === 'alternative').map(item => [item.line, item.visibility]))
    .toEqual([[25, 'private'], [27, 'public']])
  // The later definition may inherit conditional internal linkage; it stays in evidence, not the outline.
  expect(worker.filter(item => item.name === 'selected').map(item => item.line)).toEqual([19, 21])
  expect(worker.find(item => item.name === 'run')).toMatchObject({ line: 10, entry: true, visibility: 'public' })
  expect(worker.map(item => item.name)).not.toContain('nested')
  expect(worker.map(item => item.name)).not.toContain('pointer_variable')
  expect(outlines[1]!.declarations.map(item => [item.kind, item.name, item.line, item.entry])).toEqual([
    ['type', 'Service', 3, true], ['type', 'Payload', 7, false], ['type', 'State', 8, false],
    ['type', 'Tagged', 9, false], ['function', 'submit', 12, false], ['function', 'local_header', 13, false],
  ])
  expect(outlines[1]!.declarations.filter(item => item.kind === 'type').every(item => item.members.length === 0)).toBeTrue()
}

async function verifyLinkageHeader(scanner: ScannerPlugin, project: string): Promise<void> {
  const source = [
    '/* 😀 physical positions */', '#ifndef API_H', '#define API_H', '#ifdef __cplusplus', 'extern "C" {', '#endif',
    'struct Context { int state; };', 'void use_context(struct Context *context);',
    'static inline int local(void) { return helper(); }', 'int broken(,);',
    '#ifdef __cplusplus', '}', '#endif', '#endif', '',
  ].join('\n')
  await writeFile(path.join(project, 'linkage.h'), source)
  const outlines = await scanner.readCodeStructure!(project, [{ file: 'linkage.h', symbols: [] }])
  expect(outlines.flatMap(outline => outline.declarations.map(item => [item.name, item.line, item.visibility])))
    .toEqual([['Context', 7, 'public'], ['use_context', 8, 'public'], ['local', 9, 'private']])
  const observation = (await scanner.scan(project, {}, ['linkage.h']))!
  expect(observation.operations!.map(item => [item.name, item.position]))
    .toEqual([['local', source.indexOf('static inline')]])
  expect(observation.invocations).toEqual([{
    source: observation.operations![0]!.id, targets: [], unresolved: true, member: 'helper',
    line: 9, position: source.indexOf('helper()'),
  }])
  expect(observation.diagnostics.some(item => item.code === 'C_PARSE_ERROR' && item.line === 10)).toBeTrue()
}

async function verifyMacroEvidence(scanner: ScannerPlugin, project: string): Promise<void> {
  await writeFile(path.join(project, 'macros.h'), [
    '#ifdef WINDOWS', '#define api __declspec(dllexport)', '#else',
    '#define api __attribute__((visibility("default")))', '#endif',
    '#define FIELDS int generated;', '#define LIST(X) X(generated)',
    '#define PRIVATE static', '#define IGNORE(value) #value', '#define START if (1) {', '#define END }',
    '#ifdef WINDOWS', '#define CALL __stdcall', '#define PUBLIC(type) __declspec(dllexport) type CALL',
    '#else', '#define CALL', '#define PUBLIC(type) __attribute__((visibility("default"))) type', '#endif',
    '#define HIDDEN(type) static type', '#define HIDDEN_TYPE static int', '#ifdef PRIVATE_BUILD', '#define MIXED(type) static type',
    '#else', '#define MIXED(type) type', '#endif',
    '#define EMPTY', '#define STEP EMPTY', '#define EXPORT STEP', '#define NEGATIVE PRIVATE',
    '#define CYCLE_A CYCLE_B', '#define CYCLE_B CYCLE_A', '#define EXTERNAL UNSELECTED',
    '#define MARK(version)', '#define DEPRECATED(version, message) __attribute__((deprecated(message)))',
    '#define INLINE inline', '#define UNUSED __attribute__((unused))', '#define LOCAL_ANNOTATION(x) static', '#define TYPE_ANNOTATION(x) x', '#define OBJECT_ANNOTATION', '',
  ].join('\n'))
  const source = [
    '#include "macros.h"', 'typedef int Counter;', 'api int exported(void);',
    'struct Context {', '  FIELDS', '};', 'struct Slots {', '  LIST(FIELD)', '};',
    'Counter ordinary(void);', 'UNKNOWN int fabricated(void);', 'PRIVATE int maybe_private(void);',
    'int maybe_private(void) { return callback(); }',
    'void invoke(void) { IGNORE(not_runtime()); runtime(); }',
    'extern "C++" { int cpp_only(void) { return cpp_call(); } }',
    'void wrapped(void) {', '  START', '  runtime();', '  END', '}',
    'void following(void) { follow(); }', 'void invalid(void) {', '  UNKNOWN', '}',
    'PUBLIC(int) published(void);', 'HIDDEN(int) hidden_type(void);',
    'int hidden_type(void) { return callback(); }', 'MIXED(int) mixed_type(void);',
    'UNKNOWN_TYPE(int) unknown_type(void);', 'HIDDEN_TYPE hidden_object(void);',
    'PUBLIC(HIDDEN_TYPE) nested_type(void);', 'EXPORT int aliased(void);',
    'NEGATIVE int alias_static(void);', 'CYCLE_A int alias_cycle(void);', 'EXTERNAL int alias_unknown(void);',
    'struct Hooks { void (CALL *free_fn)(void *ptr); };',
    'struct UnknownHooks { void (MISSING_CALL *free_fn)(void *ptr); };',
    'int MARK(1) old_api(void);', 'struct List { int value; };',
    'int DEPRECATED(7.56.0, "") old_version(void);',
    'int LOCAL_ANNOTATION(1) local_annotation(void);', 'int local_annotation(void) { return callback(); }',
    'int UNKNOWN_ANNOTATION(1) unknown_annotation(void);', 'struct Following { int value; };',
    'int TYPE_ANNOTATION(1) uncertain_annotation(void);',
    'int OBJECT_ANNOTATION(1) object_annotation(void);',
    'static INLINE UNUSED', 'void private_inline(void) { ordinary(); }', '',
  ].join('\n')
  await writeFile(path.join(project, 'macros-api.h'), source)
  const files = ['macros.h', 'macros-api.h']
  const references = [{ file: 'macros-api.h', symbols: [] }]
  const outlines = await scanner.readCodeStructure!(project, references, {}, files)
  expect(outlines.flatMap(outline => outline.declarations.map(item => [item.name, item.visibility])))
    .toEqual([['exported', 'public'], ['Context', 'public'], ['Slots', 'public'], ['ordinary', 'public'], ['invoke', 'public'],
      ['wrapped', 'public'], ['following', 'public'], ['published', 'public'], ['aliased', 'public'], ['Hooks', 'public'],
      ['old_api', 'public'], ['List', 'public'], ['old_version', 'public'], ['Following', 'public'], ['private_inline', 'private']])
  expect(outlines[0]!.declarations[0]).toMatchObject({ line: 3, kind: 'function' })
  const observation = (await scanner.scan(project, {}, files))!
  expect(observation.operations!.find(item => item.name === 'private_inline')!.position).toBe(source.indexOf('static INLINE UNUSED'))
  const invoke = observation.operations!.find(item => item.name === 'invoke')!
  expect(observation.invocations!.filter(call => call.source === invoke.id).map(call => call.member)).toEqual(['runtime'])
  expect(observation.operations!.map(item => item.name)).not.toContain('cpp_only')
  expect(observation.operations!.map(item => item.name)).not.toContain('invalid')
  const following = observation.operations!.find(item => item.name === 'following')!
  expect(following.position).toBe(source.indexOf('void following'))
  expect(observation.invocations!.filter(call => call.source === following.id).map(call => call.member)).toEqual(['follow'])
  expect(observation.files.flatMap(file => file.symbols!.map(item => item.name))).not.toContain('fabricated')
  expect(observation.diagnostics.some(item => item.code === 'C_MACRO_UNRESOLVED' && item.line === 11)).toBeTrue()
  expect(observation.diagnostics.some(item => item.code === 'C_MACRO_FIELDS_OMITTED')).toBeTrue()
  // Missing selected context must not trigger include walking or prove an unknown prefix.
  expect((await scanner.readCodeStructure!(project, references)).flatMap(outline => outline.declarations.map(item => item.name)))
    .not.toContain('exported')
}

async function verifyConditionalSignatures(scanner: ScannerPlugin, project: string): Promise<void> {
  const branches = ['#ifdef WINDOWS', '#ifdef DIAGNOSTICS', '#pragma warning(push)', '#endif',
    'int wmain(void)', '#else', 'int main(void)', '#endif'].join('\n')
  const body = '{\nint nested(void) { return inside(); }\n#ifdef DEBUG\nif (check())\n#endif\nrun(); nested();\n}\n'
  const source = `${branches}\n${body}`
  await writeFile(path.join(project, 'entry.c'), source)
  const observation = (await scanner.scan(project, {}, ['entry.c']))!
  expect(observation.operations!.map(item => item.name).sort()).toEqual(['main', 'nested', 'wmain'])
  for (const name of ['wmain', 'main']) {
    const owner = observation.operations!.find(item => item.name === name)!
    expect(owner.position).toBe(source.indexOf(`int ${name}`))
    expect(observation.invocations!.filter(call => call.source === owner.id).map(call => call.member)).toEqual(['check', 'run', 'nested'])
  }
  const nested = observation.operations!.find(item => item.name === 'nested')!
  expect(observation.invocations!.filter(call => call.source === nested.id).map(call => call.member)).toEqual(['inside'])
  expect(observation.entryPoints).toBeUndefined()
  const outline = await scanner.readCodeStructure!(project, [{ file: 'entry.c', symbols: [] }])
  expect(outline[0]!.declarations.map(item => [item.name, item.line])).toEqual([['wmain', 5], ['main', 7]])
  const invalid = [
    `${branches.replaceAll('(void)', '(void);')}\n${body}`,
    `${branches}\nint intervening;\n${body}`,
    `${branches.replace('int wmain(void)', 'int wmain(,)')}\n${body}`,
    `${branches.replace('int main(void)', '')}\n${body}`,
    `${branches}\n{ invalid(,); }\n`,
    `${branches}\n{\n#ifdef DEBUG\nif(check())\n#endif\n}\n`,
    `${branches}\n{\n#ifdef DEBUG\nif(check(,))\n#endif\nrun();\n}\n`,
    `${branches}\n{\n#ifdef DEBUG\nif(check())\n#endif\nrun(,);\n}\n`,
    `${branches}\n{\n#ifdef DEBUG\nif(check())\n#endif\nint declaration;\n}\n`,
    `${branches}\n{\n#ifdef DEBUG\nif(check())\n#endif\nrun(); missing()\n}\n`,
  ]
  for (const source of invalid) {
    await writeFile(path.join(project, 'invalid-entry.c'), source)
    const rejected = (await scanner.scan(project, {}, ['invalid-entry.c']))!
    expect(rejected.operations).toEqual([])
    expect(rejected.invocations).toEqual([])
  }
  const guarded = 'void guarded(void) {\n#ifndef DISABLED\nif(check()) { first(); } else\n#endif\nsecond();\nafter();\n}\n'
  await writeFile(path.join(project, 'guarded.c'), guarded)
  const preserved = (await scanner.scan(project, {}, ['guarded.c']))!
  expect(preserved.operations!.map(item => item.name)).toEqual(['guarded'])
  expect(preserved.invocations!.map(call => [call.source, call.member]))
    .toEqual(['check', 'first', 'second', 'after'].map(member => [preserved.operations![0]!.id, member]))
  for (const malformed of [
    guarded.replace('guarded(void)', 'guarded(,)'),
    guarded.replace('check()', 'check(,)'),
    guarded.replace('#endif', ''),
    guarded.replace('second();', 'int missing_statement;'),
    guarded.replace('second();', 'second(,);'),
    guarded.replace('after();', 'after()'),
  ]) {
    await writeFile(path.join(project, 'invalid-guard.c'), malformed)
    const rejected = (await scanner.scan(project, {}, ['invalid-guard.c']))!
    expect(rejected.operations).toEqual([])
    expect(rejected.invocations).toEqual([])
  }
}

async function verifyMacroCallerScope(scanner: ScannerPlugin, project: string): Promise<void> {
  const source = [
    '#define OPEN_NESTED void generated(void) {', '#define CLOSE_NESTED }',
    '#define OPEN() } void generated(void) {', '#define CLOSE() } void resumed(void) {',
    'void outer(void) {', '  OPEN_NESTED', '  hidden();', '  CLOSE_NESTED', '  visible();', '}',
    'void outer_call(void) { OPEN(); hidden(); CLOSE(); visible(); }',
    '#ifdef WINDOWS', 'int wmain(void)', '#else', 'int main(void)', '#endif',
    '{ OPEN(); hidden(); CLOSE(); visible(); }',
    'void ordinary(void) { known(); }',
    '#define NEUTRAL(value) do { const char *text = "}"; (value); } while (0)',
    '#define ALIAS(value) NEUTRAL(value)', '#define SCOPE_ALIAS OPEN()',
    '#define CYCLE_A() CYCLE_B()', '#define CYCLE_B() CYCLE_A()',
    '#define RELAY(function) function()', '#define FUNCTION_ALIAS OPEN',
    'void safe(void) { ALIAS(discarded()); after_safe(); }',
    'void alias_unsafe(void) { SCOPE_ALIAS; hidden_alias(); }',
    'void cycle(void) { CYCLE_A(); hidden_cycle(); }',
    'void argument(void) { NEUTRAL(({ nested_argument(); })); hidden_argument(); }',
    'void relay(void) { RELAY(OPEN); hidden_relay(); }',
    'void function_alias(void) { FUNCTION_ALIAS(); hidden_function_alias(); }',
    '#define MEASURE() sizeof', 'int hidden(void);', 'void after(void);',
    'void measured(void) { MEASURE()(hidden()); after(); }',
    '#define ENUM_ENTER(fn) enter(ENUM_FN_##fn)', '#define SUFFIX(name) name##_ENUM',
    '#define CODE_VALUE(name) (0 - ERROR_##name)',
    '#define RETURN_CODE(name) do { return CODE_VALUE(name); } while(0)',
    '#define GLUE(a, b) a##b', '#define UNSAFE_open } void generated(void) {',
    '#define MATCH(name) UNSAFE_##name', '#define EMPTY_ } void generated(void) {', '#define PASTE_EMPTY(name) EMPTY_##name',
    'void pasted(void) { ENUM_ENTER(run); SUFFIX(run); central_call(); }',
    'int return_code(void) { reset(); RETURN_CODE(failed); }',
    'void ambiguous_paste(void) { GLUE(UNSAFE_, open); hidden_paste(); }',
    'void matching_paste(void) { MATCH(open); hidden_match(); }',
    'void empty_paste(void) { PASTE_EMPTY(); hidden_empty(); }',
    String.raw`#define STRINGMARK "/*stdin*\\"`,
    'void quoted_direct(void) { consume(STRINGMARK); after_quote(); }', '/* a real comment */',
    String.raw`#define GROUPED ("/*stdin*\\")`,
    'void quoted_grouped(void) { consume(GROUPED); after_quote(); }', '/* a real comment */',
    String.raw`#define CONCAT "prefix" "/*stdin*\\"`,
    'void quoted_concat(void) { consume(CONCAT); after_quote(); }', '/* a real comment */',
    String.raw`#define CONTINUED 1 /* real comment */ \
 + 2`, 'void continued(void) { consume(CONTINUED); after_comment(); }',
    "#define COMMENTED 1 // Don't hide code", 'void commented(void) { consume(COMMENTED); after_comment(); }', '',
  ].join('\n')
  await writeFile(path.join(project, 'macro-scope.c'), source)
  const observation = (await scanner.scan(project, {}, ['macro-scope.c']))!
  expect(observation.operations!.map(item => item.name).sort()).toEqual(['alias_unsafe', 'ambiguous_paste', 'argument', 'commented', 'continued', 'cycle', 'empty_paste', 'function_alias', 'main', 'matching_paste', 'measured', 'ordinary', 'outer', 'outer_call', 'pasted', 'quoted_concat', 'quoted_direct', 'quoted_grouped', 'relay', 'return_code', 'safe', 'wmain'])
  const owners = new Map(observation.operations!.map(item => [item.id, item.name]))
  expect(observation.invocations!.map(call => [owners.get(call.source), call.member]))
    .toEqual([['ordinary', 'known'], ['safe', 'after_safe'], ['measured', 'after'], ['pasted', 'central_call'], ['return_code', 'reset'], ['quoted_direct', 'consume'], ['quoted_direct', 'after_quote'],
      ['quoted_grouped', 'consume'], ['quoted_grouped', 'after_quote'], ['quoted_concat', 'consume'], ['quoted_concat', 'after_quote'],
      ['continued', 'consume'], ['continued', 'after_comment'], ['commented', 'consume'], ['commented', 'after_comment']])
  for (const name of ['quoted_direct', 'quoted_grouped', 'quoted_concat', 'continued', 'commented']) {
    expect(observation.operations!.find(operation => operation.name === name)!.position).toBe(source.indexOf(`void ${name}`))
  }
  expect(observation.diagnostics.filter(item => item.code === 'C_CALLER_SCOPE_UNCERTAIN')).toHaveLength(12)
}

test.concurrent('packaged C scanner preserves source declarations, linkage uncertainty and caller ownership', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'groma-c-'))
  try {
    const artifact = path.join(temporary, 'scanner')
    await buildPackage(artifact)
    const scanner = (await import(pathToFileURL(path.join(artifact, 'src/index.js')).href)).default as ScannerPlugin
    await scanner.checkReadiness!(fixture, {}, ['api.h', 'worker.c'])
    expect(await scanner.listSourceFiles!(fixture, {}, ['api.h', 'worker.c', 'module.cpp', 'Makefile']))
      .toEqual(['api.h', 'worker.c'])
    const first = (await scanner.scan(fixture, {}, ['worker.c', 'api.h']))!
    expect(first.files.map(file => file.file)).toEqual(['api.h', 'worker.c'])
    expect(first.diagnostics.filter(item => item.code === 'C_PARSE_ERROR')).toEqual([])
    verifyCalls(first, await readFile(path.join(fixture, 'worker.c'), 'utf8'))
    await verifyOutline(scanner)
    expect(await scanner.scan(fixture, {}, ['api.h', 'worker.c'])).toEqual(first)

    const project = path.join(temporary, 'project')
    await cp(fixture, project, { recursive: true })
    await verifyMacroCallerScope(scanner, project)
    await verifyLinkageHeader(scanner, project)
    await verifyMacroEvidence(scanner, project)
    await verifyConditionalSignatures(scanner, project)
    await writeFile(path.join(project, 'not-selected.h'), Buffer.from([0xff, 0xfe]))
    // Even an explicit #include cannot make the scanner read a file Groma did not select.
    expect((await scanner.scan(project, {}, ['worker.c']))!.files).toHaveLength(1)
    await expect(scanner.scan(project, {}, ['not-selected.h'])).rejects.toThrow()
    const windows = '\uFEFF/* 😀 */\r\nint ship(void) { return pack(); }\r\n'
    await writeFile(path.join(project, 'windows.c'), windows)
    const observation = (await scanner.scan(project, {}, ['windows.c']))!
    expect(observation.operations![0]).toMatchObject({ name: 'ship', position: windows.indexOf('int ship') })
    expect(observation.invocations![0]).toMatchObject({ member: 'pack', line: 2, position: windows.indexOf('pack()') })
    await writeFile(path.join(project, 'broken.c'), 'int broken( { return fake(); }\nint valid(void) { return real(); }\n')
    const broken = (await scanner.scan(project, {}, ['broken.c']))!
    expect(broken.diagnostics.some(item => item.code === 'C_PARSE_ERROR' && item.file === 'broken.c')).toBeTrue()
    expect(broken.operations!.map(operation => operation.name)).not.toContain('broken')
    expect(broken.invocations!.map(call => call.member)).not.toContain('fake')
  } finally { await rm(temporary, { recursive: true, force: true }) }
})
