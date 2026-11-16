import type { DraftInput } from '../../../authoring.ts'
import { approvalBar } from '../atoms/approval-bar.ts'

export interface RelateDialogEnds {
  sourceTitle: string
  targetTitle: string
  sourceFiles: string[]
  targetFiles: string[]
}

/** The sentence of a new relation: how the source uses the target, and through what. */
export function createRelateDialog(add: (input: DraftInput) => Promise<void>) {
  const dialog = document.createElement('dialog')
  dialog.id = 'relate-dialog'
  dialog.className = 'verb-dialog'
  dialog.innerHTML = '<form><h1></h1>'
    + '<label>Source file<select name="source" required></select></label>'
    + '<label>Target file<select name="target" required></select></label>'
    + '<label>Description<input name="description" required></label>'
    + '<label>Technology<input name="technology" required></label></form>'
  document.body.append(dialog)

  const form = dialog.querySelector('form')!
  const heading = form.querySelector('h1')!
  const source = form.elements.namedItem('source') as HTMLSelectElement
  const target = form.elements.namedItem('target') as HTMLSelectElement
  const description = form.elements.namedItem('description') as HTMLInputElement
  const technology = form.elements.namedItem('technology') as HTMLInputElement
  const approval = approvalBar('Save')
  form.append(approval.bar)
  let ends: RelateDialogEnds | undefined

  approval.cancel.addEventListener('click', () => dialog.close())
  form.addEventListener('submit', async event => {
    event.preventDefault()
    if (ends === undefined) return
    const outcome = await approval.approve(() => add({
      kind: 'relation',
      name: source.value,
      relation: target.value,
      description: description.value,
      technology: technology.value,
    }))
    if (outcome === 'stored') dialog.close()
  })

  return {
    close: () => dialog.close(),
    open(next: RelateDialogEnds): void {
      ends = next
      heading.textContent = `Draft relationship: ${next.sourceTitle} to ${next.targetTitle}`
      form.reset()
      for (const [select, files] of [[source, next.sourceFiles], [target, next.targetFiles]] as const) {
        select.replaceChildren(...files.map(file => new Option(file, file)))
      }
      approval.approveButton.disabled = next.sourceFiles.length === 0 || next.targetFiles.length === 0
      approval.clear()
      dialog.showModal()
      description.focus()
    },
  }
}
