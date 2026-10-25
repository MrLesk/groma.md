import { propertyKey, unwrapped, type Node } from './http-syntax.ts'
import { declarationOf, functionOf, type FunctionBody, type UrlContext } from './http-values.ts'

/*
 * A local wrapper around the runtime's `fetch`, such as one that adds credentials, sends the request its
 * callers describe. The wrapper's own `fetch` call reads a parameter, so the request is reported at each
 * call of the wrapper, with the URL and options its caller gives.
 */
interface Call extends Node { expression: Node; arguments: readonly Node[] }

/** Which of the wrapper's parameters reach `fetch`: its URL, and the options that may state the method. */
interface Forwarding {
  url: number
  options: number | undefined
}

/** The arguments of a call to a wrapper that a `fetch` request is made of. */
export interface ForwardedFetch {
  url: Node
  options: Node | undefined
}

const forwardings = new WeakMap<Node, Promise<Forwarding | undefined>>()

/** The position of the parameter a name is, when the sources never assign it again. */
async function parameterAt(context: UrlContext, fn: FunctionBody, name: Node): Promise<number> {
  if (!context.ts.isIdentifier(unwrapped(context.ts, name))) return -1
  const declaration = await declarationOf(context, unwrapped(context.ts, name))
  const position = declaration === undefined ? -1 : (fn.parameters as readonly Node[]).indexOf(declaration)
  const plain = position >= 0 && context.ts.isIdentifier(fn.parameters[position]!.name)
    && fn.parameters[position]!.dotDotDotToken === undefined
  return plain && !await context.bindings.reassigned(declaration!) ? position : -1
}

/**
 * The one parameter an options object spreads, or undefined when it spreads none. -1 when the options are not
 * forwarded: a second spread, a spread of anything but a parameter, a `method`, or a key the scan cannot read.
 */
async function spreadPosition(context: UrlContext, fn: FunctionBody, properties: readonly Node[]): Promise<number | undefined> {
  const { ts } = context
  let found: number | undefined
  for (const property of properties) {
    if (ts.isSpreadAssignment(property)) {
      const position = await parameterAt(context, fn, property.expression)
      if (position < 0 || found !== undefined) return -1
      found = position
    } else {
      const key = propertyKey(ts, property)
      if (key === undefined || key === 'method') return -1
    }
  }
  return found
}

/**
 * The parameter that supplies `fetch` its options: the options themselves, or the one parameter an object
 * spreads beside properties that leave the method alone. Options without one state a `GET`; options that
 * may state the method themselves are not forwarded.
 */
async function forwardedOptions(context: UrlContext, fn: FunctionBody, options: Node | undefined): Promise<{ position: number | undefined } | undefined> {
  if (options === undefined) return { position: undefined }
  const value = unwrapped(context.ts, options)
  const position = context.ts.isObjectLiteralExpression(value)
    ? await spreadPosition(context, fn, value.properties) : await parameterAt(context, fn, value)
  return position === -1 ? undefined : { position }
}

/** The calls in a node, itself included, in source order. */
function callsIn(context: UrlContext, node: Node): Call[] {
  const calls: Call[] = []
  const visit = (child: Node): void => {
    if (context.ts.isCallExpression(child)) calls.push(child)
    context.ts.forEachChild(child, visit)
  }
  visit(node)
  return calls
}

/** A function that makes exactly one `fetch` request, with a URL that is one of its parameters. */
async function forwardingOf(
  context: UrlContext, fn: FunctionBody, client: (callee: Node) => Promise<unknown>,
): Promise<Forwarding | undefined> {
  const calls = fn.body === undefined ? [] : callsIn(context, fn.body)
  const fetches = (await Promise.all(calls.map(async call => await client(call.expression) !== undefined ? call : undefined)))
    .filter(call => call !== undefined)
  const [request, ...others] = fetches
  const [input, init] = request?.arguments ?? []
  if (request === undefined || others.length > 0 || input === undefined) return undefined
  const url = await parameterAt(context, fn, input)
  const options = await forwardedOptions(context, fn, init)
  return url < 0 || options === undefined ? undefined : { url, options: options.position }
}

/** The function a name declares, when it is spelled like a callee. */
function declaredFunction(context: UrlContext, name: Node): FunctionBody | undefined {
  const { ts } = context
  const { parent } = name
  if (ts.isFunctionDeclaration(parent)) return parent
  if (!ts.isVariableDeclaration(parent) || parent.initializer === undefined) return undefined
  const value = unwrapped(ts, parent.initializer)
  return ts.isArrowFunction(value) || ts.isFunctionExpression(value) ? value : undefined
}

/**
 * The URL and options a call hands to a wrapper that forwards them to `fetch`, where `client` recognizes
 * the runtime's `fetch`. Only a wrapper with one `fetch` call is read, and one wrapper does not forward to another.
 */
export async function forwardedFetch(
  context: UrlContext, call: Call, client: (callee: Node) => Promise<unknown>,
): Promise<ForwardedFetch | undefined> {
  const callee = call.expression
  if (!context.ts.isIdentifier(callee) || call.arguments.length === 0) return undefined
  const named = context.bindings.named(callee.text).map(name => declaredFunction(context, name)).filter(fn => fn !== undefined)
  for (const fn of named) {
    let forwarding = forwardings.get(fn)
    if (forwarding === undefined) {
      forwarding = forwardingOf(context, fn, client)
      forwardings.set(fn, forwarding)
    }
    const found = await forwarding
    if (found === undefined || await functionOf(context, callee) !== fn) continue
    const url = call.arguments[found.url]
    if (url === undefined) return undefined
    return { url, options: found.options === undefined ? undefined : call.arguments[found.options] }
  }
  return undefined
}
