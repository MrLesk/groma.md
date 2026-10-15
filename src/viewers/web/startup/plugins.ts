import type { ScannerRecommendation, TechnologyFinding } from '../../../scanner/modules/catalog.ts'
import type { ScannerDiscovery } from '../../../scanner/modules/discovery.ts'
import { installableScanners } from '../../../scanner/modules/setup.ts'
import { escaped } from '../atoms/escape.ts'
import { scannerName } from '../scanners/name.ts'

function evidenceRow(finding: TechnologyFinding): string {
  const version = finding.resolvedVersion?.version ?? finding.version
  const installed = finding.resolvedVersion
    ? `<span>Installed ${escaped(finding.resolvedVersion.version)} · ${escaped(finding.resolvedVersion.file)}</span>` : ''
  return `<li data-evidence><code>${escaped(finding.file)}</code><span>${escaped(finding.declaration)}${version ? ` · ${escaped(version)}` : ''}</span>${installed}</li>`
}

function scannerRow(item: ScannerRecommendation, missing: boolean): string {
  const name = scannerName(item.id)
  const install = item.status === 'installable' && item.installSource !== undefined
  const attention = missing || item.status === 'incompatible'
  const status = attention ? 'Needs attention' : install ? 'Install' : 'Installed'
  const versions = [...new Set(item.evidence.map(finding => finding.resolvedVersion?.version ?? finding.version).filter(Boolean))]
  const version = versions.length ? `<span class="detected-version">${escaped(versions.join(', '))} detected</span>` : ''
  const choice = install ? `<input type="checkbox" name="scanner" value="${escaped(item.id)}" aria-label="Install ${escaped(name)} scanner" checked>` : ''
  const heading = `<span class="scanner-heading"><strong>${escaped(name)}</strong>${version}</span>`
  const state = `<span class="scanner-state${attention ? ' attention' : ''}">${status}</span>`
  const title = install ? `<label class="scanner-choice">${choice}${heading}${state}</label>`
    : `<div class="scanner-choice">${heading}${state}</div>`
  const issue = attention ? `<p class="scanner-issue">${escaped(missing ? 'The configured scanner package is missing.' : item.reason)}</p>` : ''
  const evidence = item.evidence.length ? `<input type="search" class="evidence-search" aria-label="Search ${escaped(name)} detection details" placeholder="Filter by path or version…">`
    + `<ul class="evidence-list">${item.evidence.map(evidenceRow).join('')}</ul><p class="no-matches" hidden>No matching declarations</p>` : ''
  const count = `${item.evidence.length} ${item.evidence.length === 1 ? 'declaration' : 'declarations'}`
  return `<section class="scanner-card">${title}${issue}<details class="scanner-evidence"><summary>Detection details <span>${count}</span></summary>`
    + `<div class="evidence-body"><code class="scanner-package">${escaped(item.installSource ?? item.package)}</code>${evidence}</div></details></section>`
}

/**
 * Backlog.md has its own section: it is not a scanner, it supplies the project's tasks. An installed CLI makes it part
 * of the project, shown checked and locked; only installing a missing CLI is a choice.
 */
function tasksSection(tasks: { installed: boolean }): string {
  const heading = '<span class="scanner-heading"><strong>Backlog.md</strong><span class="detected-version">Your project\'s tasks on the map</span></span>'
  const card = tasks.installed
    ? '<div class="scanner-choice"><input type="hidden" name="workSource" value="backlog">'
      + `<input type="checkbox" aria-label="Backlog.md is included" checked disabled>${heading}<span class="scanner-state">Installed</span></div>`
    : '<label class="scanner-choice"><input type="checkbox" name="workSource" value="backlog" aria-label="Install Backlog.md for tasks" checked>'
      + `${heading}<span class="scanner-state">Install</span></label>`
  return `<section class="plugin-section"><h2>Tasks</h2><div class="scanner-card">${card}</div></section>`
}

/**
 * The plugins to set up, one section per kind: Backlog.md first when config.json lists no work source yet, then the
 * detected scanners. Discovery evidence stays available without competing with the scanner selection.
 */
export function pluginSelection(proposal: ScannerDiscovery, tasks?: { installed: boolean }): string {
  const missing = new Set(proposal.inventory.filter(item => item.status === 'missing').map(item => item.id))
  const attention = (item: ScannerRecommendation) => missing.has(item.id) || item.status === 'incompatible'
  const rows = [...proposal.recommendations].sort((a, b) => Number(attention(b)) - Number(attention(a)))
  const extras = proposal.inventory.filter(item => !rows.some(row => row.id === item.id)).map(item => scannerRow({
    id: item.id, package: item.source, status: 'configured', evidence: [], reason: '',
  }, item.status === 'missing'))
  const notes = proposal.limits.length ? `<details class="coverage-notes"><summary>Coverage notes <span>${proposal.limits.length}</span></summary><ul>${proposal.limits.map(note => `<li>${escaped(note)}</li>`).join('')}</ul></details>` : ''
  const empty = rows.length + extras.length === 0 ? '<p class="scanner-empty">No matching scanners detected.</p>' : ''
  const install = installableScanners(proposal).length || (tasks && !tasks.installed)
  return `<form method="post" action="/plugins" id="plugin-selection">${tasks ? tasksSection(tasks) : ''}<section class="plugin-section"><h2>Scanners</h2>`
    + `<div class="scanner-list">${rows.map(item => scannerRow(item, missing.has(item.id))).join('')}${extras.join('')}${empty}</div>${notes}</section>`
    + `<button type="submit">${install ? 'Install &amp; scan' : 'Scan project'}</button></form>`
}

export const pluginSelectionScript = `
  const pluginForm = document.querySelector('#plugin-selection');
  pluginForm?.addEventListener('change', () => {
    const backlog = pluginForm.querySelector('input[name="workSource"]:checked');
    const install = pluginForm.querySelector('input[name="scanner"]:checked')
      || (backlog && backlog.closest('.scanner-card').querySelector('.scanner-state').textContent === 'Install');
    pluginForm.querySelector('button[type="submit"]').textContent = install ? 'Install & scan' : 'Scan project';
  });
  document.querySelectorAll('.evidence-search').forEach(input => {
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') event.preventDefault();
    });
    input.addEventListener('input', () => {
      const body = input.closest('.evidence-body');
      const query = input.value.trim().toLowerCase();
      const rows = [...body.querySelectorAll('[data-evidence]')];
      rows.forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
      body.querySelector('.no-matches').hidden = rows.some(row => !row.hidden);
    });
  });
`
