/**
 * OKF `tags` are short strings that name cross-cutting categories of an element.
 * Documents store them as a list. Commands and forms write them as one comma-separated text.
 */

/** The tags named by comma-separated text, in the order written, without blanks or repeats. */
export function parseTags(text: string): string[] {
  const tags = text.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
  return [...new Set(tags)]
}

/** The comma-separated text a command or form shows for a list of tags. */
export function formatTags(tags: readonly string[] | undefined): string {
  return (tags ?? []).join(', ')
}
