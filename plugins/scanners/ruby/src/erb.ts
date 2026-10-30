/** Keep UTF-16 offsets and line breaks so Ruby evidence addresses the template. */
export function embeddedRuby(file: string, template: string): string {
  const ruby = template.replace(/[^\r\n]/g, ' ').split('')
  const tags = /<%([%=#-]?)/g
  for (let tag = tags.exec(template); tag; tag = tags.exec(template)) {
    const start = tag.index
    const body = tags.lastIndex
    if (tag[1] === '%') continue
    const close = template.indexOf('%>', body)
    if (close < 0) throw new Error(`ruby: ${file}: unclosed ERB tag at position ${start}.`)
    tags.lastIndex = close + 2
    if (tag[1] === '#') continue
    const end = template[close - 1] === '-' ? close - 1 : close
    // Delimit adjacent expressions without inserting characters or new lines.
    for (let index = body; index < end; index++) ruby[index] = template[index]!
    ruby[close] = ';'
  }
  return ruby.join('')
}
