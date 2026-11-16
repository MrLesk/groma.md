import { approvalBar } from '../atoms/write-form.ts'
import type { WebDataSource } from '../data.ts'
import type { CreationKind } from './intent.ts'

type Creation = { kind: CreationKind; parent?: string; parentTitle?: string } | { kind: 'group'; members: string[] }

/** Creation collects meaning after the gesture has chosen the ownership or members. */
export function createDialog(data: WebDataSource) {
  const dialog = document.createElement('dialog')
  dialog.id = 'create-dialog'
  dialog.className = 'verb-dialog'
  dialog.innerHTML = '<form class="write-form"><h1></h1><label>Name<input name="name" required></label>'
    + '<label data-overview>Overview<textarea name="overview"></textarea></label></form>'
  document.body.append(dialog)
  const form = dialog.querySelector('form')!
  const name = form.elements.namedItem('name') as HTMLInputElement
  const overview = form.elements.namedItem('overview') as HTMLTextAreaElement
  // A draft is saved. A group gets its own label when the dialog opens for one.
  const approval = approvalBar('Save')
  form.append(approval.bar)
  let creation: Creation | undefined
  approval.cancel.addEventListener('click', () => dialog.close())
  form.addEventListener('submit', async event => {
    event.preventDefault()
    const created = creation
    if (created === undefined) return
    const outcome = await approval.approve(() => created.kind === 'group'
      ? data.add!({ thing: 'group', name: name.value, members: created.members })
      : data.draft!({ kind: created.kind, name: name.value, parent: created.parent, overview: overview.value }))
    if (outcome === 'stored') dialog.close()
  })
  return {
    close: () => dialog.close(),
    open(next: Creation): void {
      creation = next
      form.reset()
      approval.clear()
      approval.approveButton.textContent = next.kind === 'group' ? 'Create group' : 'Save'
      form.querySelector('h1')!.textContent = next.kind === 'group' ? `Group ${next.members.length} components`
        : `Draft ${next.kind}${next.parentTitle === undefined ? '' : ` in ${next.parentTitle}`}`
      form.querySelector<HTMLElement>('[data-overview]')!.hidden = next.kind === 'group'
      dialog.showModal()
      name.focus()
    },
  }
}
