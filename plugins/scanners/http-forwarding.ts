import { propertyKey, unwrapped, type Call, type Node } from './http-syntax.ts'
import { declarationOf, functionOf, type FunctionBody, type UrlContext } from './http-values.ts'

/*
 * A local wrapper around the runtime's `fetch`, such as one that adds credentials, sends the request its
 * callers describe. The wrapper's own `fetch` call reads a parameter, so the request is reported at each
 * call of the wrapper, with the URL and options its caller gives.
 */

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

/** A context has one way of recognizing `fetch`, so what a wrapper forwards is read once per context. */
const forwardings = new WeakMap<UrlContext, Map<Node, Promise<Forwarding | undefined>>>()

/** The position of the parameter a name is, when it has no default and the sources never assign it again. */
async function parameterAt(context: UrlContext, fn: FunctionBody, name: Node): Promise<number> {
  if (!context.ts.isIdentifier(unwrapped(context.ts, name))) return -1
  const declaration = await declarationOf(context, unwrapped(context.ts, name))
  const position = declaration === undefined ? -1 : (fn.parameters as readonly Node[]).indexOf(declaration)
  const plain = position >= 0 && context.ts.isIdentifier(fn.parameters[position]!.name)
    && fn.parameters[position]!.dotDotDotToken === undefined && fn.parameters[position]!.initializer === undefined
  return plain && !await context.bindings.reassigned(declaration!) ? position : -1
}

/** The caller's method reaches fetch only while the wrapper leaves that option unchanged. */
async function optionsParameterAt(context: UrlContext, fn: FunctionBody, name: Node): Promise<number> {
  const position = await parameterAt(context, fn, name)
  if (position < 0) return -1
  const unchanged = await context.bindings.unchanged(fn.parameters[position]!, ['method'], unwrapped(context.ts, name))
  return unchanged ? position : -1
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
      const position = await optionsParameterAt(context, fn, property.expression)
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
    ? await spreadPosition(context, fn, value.properties) : await optionsParameterAt(context, fn, value)
  return position === -1 ? undefined : { position }
}

/** The calls in this body, excluding functions that run only when separately invoked. */
function callsIn(context: UrlContext, node: Node): Call[] {
  const calls: Call[] = []
  const visit = (child: Node): void => {
    if (context.ts.isFunctionLike(child)) return
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
  if (fn.body === undefined || fn.asteriskToken !== undefined) return undefined
  const calls = callsIn(context, fn.body)
  const fetches = (await Promise.all(calls.map(async call => await client(call.expression) !== undefined ? call : undefined)))
    .filter(call => call !== undefined)
  const [request, ...others] = fetches
  const [input, init] = request?.arguments ?? []
  if (request === undefined || others.length > 0 || input === undefined) return undefined
  const url = await parameterAt(context, fn, input)
  const options = await forwardedOptions(context, fn, init)
  return url < 0 || options === undefined ? undefined : { url, options: options.position }
}

/**
 * The URL and options a call hands to a wrapper that forwards them to `fetch`, where `client` recognizes
 * the runtime's `fetch`. The wrapper is a name or a member of an imported module, such as `api.send(url)`.
 * Only a wrapper with one `fetch` call is read, and one wrapper does not forward to another.
 */
export async function forwardedFetch(
  context: UrlContext, call: Call, client: (callee: Node) => Promise<unknown>,
): Promise<ForwardedFetch | undefined> {
  const { ts } = context
  const callee = ts.isPropertyAccessExpression(call.expression) ? call.expression.name : call.expression
  if (!ts.isIdentifier(callee) || call.arguments.length === 0) return undefined
  const fn = await functionOf(context, callee)
  if (fn === undefined) return undefined
  const known = forwardings.get(context) ?? new Map<Node, Promise<Forwarding | undefined>>()
  forwardings.set(context, known)
  const forwarding = known.get(fn) ?? forwardingOf(context, fn, client)
  known.set(fn, forwarding)
  const found = await forwarding
  const url = found === undefined ? undefined : call.arguments[found.url]
  return found === undefined || url === undefined ? undefined
    : { url, options: found.options === undefined ? undefined : call.arguments[found.options] }
}
