import type { ScanHttpEndpoint, ScanHttpRequest } from '@groma/scanner'
import ts from 'typescript'
import { classicChecker } from '../../http-checker.ts'
import { withOrder } from '../../http-order.ts'
import type { RouterCompiler, RouterContext } from '../../http-routers.ts'
import { routerEndpoints, serveEndpoints } from '../../http-routes.ts'
import type { Node } from '../../http-syntax.ts'
import { heldAt, urlContext } from '../../http-values.ts'
import type { FileEvidence } from './evidence.ts'
import { httpRequest } from './http-requests.ts'
import type { JavaScriptSource } from './sources.ts'

/**
 * The compiler's own name resolution for one file, as a program holding only that file: imports and
 * the runtime's globals resolve to nothing, as everything outside the file does for this scanner.
 * The program asks its host for the file by the parser's name, so that name is the one compared here.
 */
export function fileChecker(syntax: ts.SourceFile): ts.TypeChecker {
  const options: ts.CompilerOptions = { allowJs: true, noLib: true, noResolve: true, types: [], noEmit: true }
  const host: ts.CompilerHost = {
    getSourceFile: name => name === syntax.fileName ? syntax : undefined,
    getDefaultLibFileName: () => 'lib.d.ts',
    writeFile: () => undefined,
    getCurrentDirectory: () => '',
    getCanonicalFileName: name => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: name => name === syntax.fileName,
    readFile: () => undefined,
  }
  return ts.createProgram([syntax.fileName], options, host).getTypeChecker()
}

function classic(node: Node): ts.Node {
  return node as unknown as ts.Node
}

/**
 * The shared readers' context over this one file. The file is read alone, so a value from another file
 * is one the scan cannot see, and exporting a router hands it to files the scan never reads.
 */
function fileContext({ file, syntax }: JavaScriptSource, evidence: FileEvidence): RouterContext {
  const context = urlContext(ts as typeof ts & RouterCompiler, classicChecker(ts, fileChecker(syntax)), [syntax], true)
  const operationAt = (node: Node): string => evidence.operationAt(classic(node))
  return {
    ...context,
    frameworks: new Set(['express', 'fastify', 'hono', 'koa']),
    exportsHandOff: true,
    async handlerOperation(handler, registration) {
      const held = handler === undefined ? undefined : await heldAt(context, handler)
      return typeof held === 'object' && ts.isFunctionLike(classic(held.node)) ? operationAt(held.node) : operationAt(registration)
    },
    callerOperation: operationAt,
    // The readers see no other file, so every node they ask about is in this one.
    file: () => file,
  }
}

export interface HttpFacts {
  httpEndpoints: ScanHttpEndpoint[]
  httpRequests: ScanHttpRequest[]
}

/** The HTTP facts the shared readers find in one file, named against the operations its evidence already recorded. */
async function statedFacts(context: RouterContext, source: JavaScriptSource, evidence: FileEvidence): Promise<HttpFacts> {
  const httpRequests: ScanHttpRequest[] = []
  for (const call of evidence.calls) {
    const request = await httpRequest(context, call)
    if (request !== undefined) httpRequests.push({ operation: evidence.operationAt(call), ...request })
  }
  const placed = await routerEndpoints(context, [source.syntax], evidence.calls)
  return { httpEndpoints: [...withOrder(placed), ...await serveEndpoints(context, evidence.calls)], httpRequests }
}

/** Whether the runtime ran out of call stack, which Bun and Node both report as a RangeError with this message. */
function stackExhausted(error: unknown): boolean {
  return error instanceof RangeError && error.message.startsWith('Maximum call stack size exceeded')
}

/**
 * The HTTP facts one file states, or `'too-deep'` when the compiler exhausts the call stack answering about it.
 * To name what a member call such as `host.send(url)` calls, the compiler infers the type of `host`, and in
 * JavaScript that means inferring a function's return type from its body, which calls the next function. A
 * large generated bundle nests those inferences deeper than the stack allows.
 */
export async function javaScriptHttpFacts(source: JavaScriptSource, evidence: FileEvidence): Promise<HttpFacts | 'too-deep'> {
  // Creating the checker binds the file, and the binder keeps its working state in the compiler, shared by
  // every file. An interrupted bind would leave that state behind for the next file, so the checker is
  // created outside the guard and an error there stays a scan failure.
  const context = fileContext(source, evidence)
  try {
    return await statedFacts(context, source, evidence)
  } catch (error) {
    // Any other error is a defect and stays visible.
    if (!stackExhausted(error)) throw error
    // An interrupted checker is in an unknown state, so nothing it answered about the file is kept. The
    // checker belongs to this file alone, so no other file is affected.
    return 'too-deep'
  }
}
