import type { AddInput } from '../../../authoring.ts'
import { approvalBar } from '../atoms/write-form.ts'

export const addDialogCss = `
  /* Hidden while creation controls are unfinished. */
  #add {
    display: none; flex: none; place-items: center; width: 28px; height: 28px; margin-right: 6px;
    border: 1px solid var(--hairline); border-radius: var(--control-radius);
    background: color-mix(in srgb, var(--paper) 35%, transparent); color: var(--muted); font-size: 16px; line-height: 1;
  }
  #add:hover { color: var(--ink); background: var(--hover); }
  body.hierarchy-collapsed #add, body[data-revision] #add { display: none; }
  .verb-dialog {
    width: min(420px, calc(100vw - 32px));
    margin: auto;
    padding: 0;
    color: var(--ink);
    background: color-mix(in srgb, var(--paper) 78%, transparent);
    border: 1px solid color-mix(in srgb, var(--ink) 16%, transparent);
    border-radius: var(--chrome-radius);
    box-shadow: 0 16px 48px color-mix(in srgb, var(--ink) 18%, transparent);
    backdrop-filter: blur(18px);
  }
  .verb-dialog::backdrop { background: color-mix(in srgb, var(--ink) 8%, transparent); }
  .verb-dialog form { display: grid; gap: 12px; padding: 20px; }
  .verb-dialog h1 { margin: 0; font-size: 18px; line-height: 1.3; }
`

/** The plus button of the hierarchy pane: one dialog declares a person, an external system, or a draft. */
export function createAddControl(button: HTMLElement, add: (input: AddInput) => Promise<void>): void {
  const dialog = document.createElement('dialog')
  dialog.id = 'add-dialog'
  dialog.className = 'verb-dialog'
  dialog.innerHTML = '<form class="write-form"><h1>Add</h1>'
    + '<label>What<select name="thing"><option value="actor">Person</option><option value="external">External system</option><option value="draft">Draft</option></select></label>'
    + '<label>Name<input name="name" required></label>'
    + '<label class="technology" hidden>Technology<input name="technology"></label>'
    + '<label>Overview<textarea name="overview" required></textarea></label></form>'
  document.body.append(dialog)

  const form = dialog.querySelector('form')!
  const thing = form.elements.namedItem('thing') as HTMLSelectElement
  const name = form.elements.namedItem('name') as HTMLInputElement
  const technology = form.elements.namedItem('technology') as HTMLInputElement
  const technologyField = form.querySelector<HTMLElement>('.technology')!
  const overview = form.elements.namedItem('overview') as HTMLTextAreaElement
  const approval = approvalBar('Add')
  form.append(approval.bar)

  const showFields = (): void => {
    technologyField.hidden = thing.value !== 'external'
  }
  thing.addEventListener('change', showFields)
  approval.cancel.addEventListener('click', () => dialog.close())
  form.addEventListener('submit', async event => {
    event.preventDefault()
    const outcome = await approval.approve(() => add({
      thing: thing.value,
      name: name.value,
      overview: overview.value,
      ...(thing.value === 'external' && technology.value !== '' ? { technology: technology.value } : {}),
    }))
    if (outcome === 'stored') dialog.close()
  })
  button.addEventListener('click', () => {
    form.reset()
    approval.clear()
    showFields()
    dialog.showModal()
    name.focus()
  })
}
