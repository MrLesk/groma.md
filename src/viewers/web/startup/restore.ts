import type { PluginPresence, RestoreState } from '../../../plugins/management.ts'
import { escaped } from '../atoms/escape.ts'
import { scannerName } from '../scanners/name.ts'

/** One plugin config.json lists that this computer lacks, as the restore view shows it while restoring. */
export interface RestoreRow {
  id: string
  name: string
  /** What config.json pins: a scanner's exact source, or the lowest CLI version of a work source. */
  pinned: string
  state: 'missing' | RestoreState
  /** Why restoring failed; empty otherwise. */
  message: string
}

export function restoreRows(missing: readonly PluginPresence[]): RestoreRow[] {
  return missing.map(plugin => plugin.kind === 'scanner'
    ? { id: plugin.id, name: `${scannerName(plugin.id)} scanner`, pinned: plugin.pinned, state: 'missing', message: '' }
    : { id: plugin.id, name: `${plugin.name} CLI`, pinned: `${plugin.pinned} or newer`, state: 'missing', message: '' })
}

function restoreRow(row: RestoreRow): string {
  return `<li data-plugin="${escaped(row.id)}" data-state="${row.state}"><span class="restore-mark" aria-hidden="true"></span>`
    + `<span class="restore-plugin"><strong>${escaped(row.name)}</strong><code>${escaped(row.pinned)}</code>`
    + `<span class="restore-message" data-message>${escaped(row.message)}</span></span></li>`
}

/** The missing plugins and the two ways forward: restore them, or open the map read-only without them. */
export function restoreContent(rows: readonly RestoreRow[], error = ''): string {
  return `<h1>Restore plugins</h1>${error}<form method="post" action="/restore" id="plugin-restore">`
    + `<ul class="restore-list">${rows.map(restoreRow).join('')}</ul><div class="restore-actions">`
    + '<button type="submit">Restore</button><button type="submit" class="secondary" formaction="/proceed">Proceed without them</button></div></form>'
}

export const restoreCss = `
  main[data-view="restore"] { width: min(640px, 100%); }
  .restore-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  .restore-list li { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; border: 1px solid var(--hairline); border-radius: 12px; min-width: 0; }
  .restore-plugin { display: grid; gap: 4px; min-width: 0; overflow-wrap: anywhere; }
  .restore-plugin strong { font-size: 16px; font-weight: 600; }
  .restore-plugin code { font-size: 11px; color: var(--muted); }
  .restore-message { font-size: 12px; color: var(--diff-removed); white-space: pre-wrap; }
  .restore-message:empty { display: none; }
  .restore-mark { width: 16px; height: 16px; margin-top: 4px; flex-shrink: 0; display: grid; place-items: center; border: 2px solid var(--hairline); border-radius: 50%; font-size: 10px; font-weight: 700; }
  [data-state="restoring"] .restore-mark { border-top-color: var(--accent); animation: spin 700ms linear infinite; }
  [data-state="restored"] .restore-mark { border-color: var(--accent); background: var(--accent); color: var(--on-colour); }
  [data-state="restored"] .restore-mark::after { content: '✓'; }
  [data-state="failed"] .restore-mark { border-color: var(--diff-removed); color: var(--diff-removed); }
  [data-state="failed"] .restore-mark::after { content: '×'; }
  .restore-actions { display: flex; flex-wrap: wrap; gap: 12px; }
  .restore-actions button { min-height: 46px; }
  button.secondary { color: var(--ink); background: transparent; border-color: var(--hairline); }
  button.secondary:hover { background: var(--hover); }
  @media (prefers-reduced-motion: reduce) { [data-state="restoring"] .restore-mark { animation: none; } }
`

/** Paints each row's state from a `restoring-plugins` startup event while Restore runs. */
export const restoreScript = `
  function showRestore(update) {
    for (const plugin of update.plugins) {
      const row = document.querySelector('[data-plugin="' + CSS.escape(plugin.id) + '"]');
      if (!row) continue;
      row.dataset.state = plugin.state;
      row.querySelector('[data-message]').textContent = plugin.message;
    }
    document.querySelector('[data-announcement]').textContent = update.plugins
      .filter(plugin => plugin.state === 'restoring').map(plugin => 'Restoring ' + plugin.name).join(' ');
  }
`
