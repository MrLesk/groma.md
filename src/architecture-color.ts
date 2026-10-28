/** An authored map accent is one opaque RGB color, independent of the UI theme. */
export function isArchitectureColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}
