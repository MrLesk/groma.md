/*
 * The approval bar: the one way a write is approved in the web map. Every form that writes, in a pane or
 * in a dialog, ends with it and has no other button that writes. From top to bottom it holds the message
 * of a failed write, then Cancel and the verb that names the write.
 */

export const approvalBarCss = `
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
  form:has(> .approval-bar) > * { transition: opacity 160ms ease; }
  form:has(> .approval-bar)[inert] > * { opacity: 0.5; }
  @media (prefers-reduced-motion: reduce) {
    .approval-bar button, form:has(> .approval-bar) > * { transition: none; }
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
  /** The verb. It is the form's submit button, so Enter in a field presses it. */
  verb: HTMLButtonElement
  /** True while a write is in flight. */
  readonly writing: boolean
  /** Empties the line of a failed write, for a form that is shown again. */
  clear(): void
  /**
   * Runs the write the verb approves and says what became of it: `'stored'` once it succeeded, `'failed'`
   * when it threw, or `'ignored'` when an earlier write of this bar is still in flight. While the write
   * runs the form is inert, so nothing is typed or pressed twice. A failed write shows its message in the
   * bar and gives the focus back to where it was.
   */
  approve(write: () => Promise<void>): Promise<'stored' | 'failed' | 'ignored'>
}

/**
 * Builds the approval bar of one form. `verb` names the write: Save, Add, Remove. `onWriting` is for a
 * caller that has more to lock than the form, such as the buttons beside it.
 */
export function approvalBar(verb: string, onWriting: (writing: boolean) => void = () => {}): ApprovalBar {
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
  approve.textContent = verb
  buttons.append(cancel, approve)
  bar.append(error, buttons)

  const writes = oneWriteAtATime(writing => {
    bar.closest('form')!.inert = writing
    onWriting(writing)
  })
  return {
    bar,
    cancel,
    verb: approve,
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
