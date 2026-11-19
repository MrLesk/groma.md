/*
 * The write form: how every form that writes looks and is approved in the web map, in a pane or in a
 * dialog. Such a form carries the class `write-form`, which gives its fields one look, and ends with the
 * approval bar built here. It has no other button that writes.
 *
 * From top to bottom the approval bar holds the message of a failed write, then Cancel and the button
 * that approves the write. The approving button says Save. It says something else only where another
 * word tells better what happens: Add, Accept, Remove, Combine, Create group.
 */

export const writeFormCss = `
  /* A field: a small label over its control. A field that is not a plain label gives its title the class field-title. */
  .write-form label { display: grid; gap: 6px; }
  .write-form label[hidden] { display: none; }
  .write-form label, .write-form .field-title {
    color: var(--muted); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  }
  .write-form :is(input, select, textarea) {
    box-sizing: border-box; width: 100%; border: 1px solid var(--hairline); border-radius: 6px; padding: 9px 10px;
    color: var(--ink); background: color-mix(in srgb, var(--paper) 72%, transparent);
    font: 12px/1.5 'SF Mono', ui-monospace, Menlo, monospace; letter-spacing: normal; text-transform: none;
    resize: none;
  }
  .write-form textarea { height: 120px; }
  .write-form :is(input, select, textarea):focus { outline: 2px solid var(--highlight); outline-offset: -1px; }

  .approval-bar { display: grid; gap: 10px; }
  .approval-bar .error { margin: 0; color: var(--highlight-text); overflow-wrap: anywhere; }
  .approval-bar .error:empty { display: none; }
  .approval-bar .buttons { display: flex; justify-content: flex-end; gap: 8px; }
  .approval-bar button {
    border: 1px solid var(--hairline); border-radius: 6px; padding: 6px 12px;
    background: transparent; color: var(--ink); white-space: nowrap; transition: background 160ms ease;
  }
  .approval-bar button:hover { background: var(--hover); }
  .approval-bar button[type="submit"] { border-color: var(--accent); color: var(--accent-text); }
  .approval-bar button:disabled { opacity: 0.5; cursor: default; }
  /* While the write is in flight the form waits: nothing in it can be pressed or typed. */
  .write-form > * { transition: opacity 160ms ease; }
  .write-form[inert] > * { opacity: 0.5; }
  @media (prefers-reduced-motion: reduce) {
    .approval-bar button, .write-form > * { transition: none; }
  }
`

/**
 * Lets the writes of one approval bar run one at a time. `run` starts a write unless another is still in
 * flight, and tells `onWriting` when writing starts and when it settles. It resolves to `'ignored'` for a
 * write that did not start and to `'done'` after one that succeeded, and rejects with a failed write's error.
 */
export function oneWriteAtATime(onWriting: (writing: boolean) => void) {
  let writing = false
  return {
    get writing(): boolean { return writing },
    async run(write: () => Promise<void>): Promise<'done' | 'ignored'> {
      if (writing) return 'ignored'
      writing = true
      onWriting(true)
      try {
        await write()
        return 'done'
      } finally {
        writing = false
        onWriting(false)
      }
    },
  }
}

export interface ApprovalBar {
  /** The bar itself. It goes last in the form whose write it approves. */
  bar: HTMLElement
  cancel: HTMLButtonElement
  /** The button that approves the write. It is the form's submit button, so Enter in a field presses it. */
  approveButton: HTMLButtonElement
  /** True while a write is in flight. */
  readonly writing: boolean
  /** Empties the line of a failed write, for a form that is shown again. */
  clear(): void
  /**
   * Runs the write the person approved and says what became of it: `'stored'` once it succeeded, `'failed'`
   * when it threw, or `'ignored'` when an earlier write of this bar is still in flight. While the write
   * runs the form is inert, so nothing is typed or pressed twice. A failed write shows its message in the
   * bar and gives the focus back to where it was.
   */
  approve(write: () => Promise<void>): Promise<'stored' | 'failed' | 'ignored'>
}

/**
 * Builds the approval bar of one form. `approveLabel` is what the approving button says, Save in most
 * forms. `onWriting` is for a caller that has more to lock than the form, such as the buttons beside it.
 */
export function approvalBar(approveLabel: string, onWriting: (writing: boolean) => void = () => {}): ApprovalBar {
  const bar = document.createElement('div')
  bar.className = 'approval-bar'
  const error = document.createElement('p')
  error.className = 'error'
  error.setAttribute('role', 'status')
  const buttons = document.createElement('div')
  buttons.className = 'buttons'
  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.textContent = 'Cancel'
  const approve = document.createElement('button')
  approve.type = 'submit'
  approve.textContent = approveLabel
  buttons.append(cancel, approve)
  bar.append(error, buttons)

  const writes = oneWriteAtATime(writing => {
    bar.closest('form')!.inert = writing
    onWriting(writing)
  })
  return {
    bar,
    cancel,
    approveButton: approve,
    get writing(): boolean { return writes.writing },
    clear(): void { error.textContent = '' },
    async approve(write): Promise<'stored' | 'failed' | 'ignored'> {
      const focused = document.activeElement
      error.textContent = ''
      try {
        return await writes.run(write) === 'done' ? 'stored' : 'ignored'
      } catch (cause) {
        error.textContent = cause instanceof Error ? cause.message : String(cause)
        if (focused instanceof HTMLElement) focused.focus()
        return 'failed'
      }
    },
  }
}
