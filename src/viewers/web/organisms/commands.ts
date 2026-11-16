import type { RunCommand } from './editable.ts'
import type { SelectionWrites } from './writes.ts'

/*
 * The commands of an Edit view: the writes that are not field changes. Each control is named by its CLI verb
 * and hands its write to `run`, which refuses while the form holds unsaved changes, writes once, returns the
 * pane to reading, and shows a refusal or a failure in the view. A control never calls its write itself.
 * A new command is one more function here, called from the `paintCommands` of the Edit view that offers it.
 */

export const commandsCss = `
  #details .edit-view .commands { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 8px; }
  #details .edit-view .commands:empty { display: none; }
  #details .commands button {
    border: 1px solid var(--hairline); border-radius: 6px; padding: 6px 10px;
    background: transparent; color: var(--muted); white-space: nowrap;
  }
  #details .commands button:hover { color: var(--ink); background: var(--hover); }
  #details .commands .remove-command .confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  #details .commands .remove-command .confirm[hidden] { display: none; }
  #details .commands .remove-command [data-confirm] { border-color: var(--highlight); color: var(--highlight-text); }
  #details .commands .selection-command { flex: 1 1 100%; display: flex; gap: 8px; }
  #details .commands .selection-command :is(input, select) {
    flex: 1; min-width: 0; border: 1px solid var(--hairline); border-radius: 4px; padding: 4px 6px;
    color: var(--ink); background: color-mix(in srgb, var(--paper) 72%, transparent); font: inherit;
  }
  #details .commands .selection-command :is(input, select):focus { outline: 2px solid var(--highlight); }
`

function button(label: string): HTMLButtonElement {
  const control = document.createElement('button')
  control.type = 'button'
  control.textContent = label
  return control
}

/** Accept: a matched ghost or a draft relationship becomes stable through the same accept input as the CLI. */
export function paintAcceptCommand(box: HTMLElement, run: RunCommand, accept: () => Promise<void>): void {
  const control = button('Accept')
  control.addEventListener('click', () => run(accept))
  box.append(control)
}

/** Remove: one click asks, the second removes. */
export function paintRemoveCommand(box: HTMLElement, run: RunCommand, title: string, remove: () => Promise<void>): void {
  const control = document.createElement('div')
  control.className = 'remove-command'
  const ask = button('Remove')
  const confirm = document.createElement('div')
  confirm.className = 'confirm'
  confirm.hidden = true
  const question = document.createElement('span')
  question.textContent = `Remove ${title}?`
  const yes = button('Remove')
  yes.dataset.confirm = ''
  const keep = button('Keep')
  confirm.append(question, yes, keep)
  control.append(ask, confirm)
  box.append(control)

  ask.addEventListener('click', () => {
    ask.hidden = true
    confirm.hidden = false
    yes.focus()
  })
  keep.addEventListener('click', () => {
    confirm.hidden = true
    ask.hidden = false
  })
  yes.addEventListener('click', () => run(remove))
}

/** Group as: names several selected components as one group. */
export function paintGroupCommand(box: HTMLElement, run: RunCommand, group: (name: string) => Promise<void>): void {
  const form = document.createElement('form')
  form.className = 'selection-command'
  const name = document.createElement('input')
  name.required = true
  name.placeholder = 'Group name'
  name.setAttribute('aria-label', 'Group name')
  const submit = button('Group as')
  submit.type = 'submit'
  form.append(name, submit)
  form.addEventListener('submit', event => {
    event.preventDefault()
    void run(() => group(name.value))
  })
  box.append(form)
}

/** Combine into: folds several selected components into the survivor the person picks. */
export function paintCombineCommand(
  box: HTMLElement, run: RunCommand, members: SelectionWrites['members'], combine: (survivor: string) => Promise<void>,
): void {
  const form = document.createElement('form')
  form.className = 'selection-command'
  const survivor = document.createElement('select')
  survivor.setAttribute('aria-label', 'Survivor')
  for (const member of members) survivor.add(new Option(member.title, member.id))
  const submit = button('Combine into')
  submit.type = 'submit'
  form.append(survivor, submit)
  form.addEventListener('submit', event => {
    event.preventDefault()
    void run(() => combine(survivor.value))
  })
  box.append(form)
}
