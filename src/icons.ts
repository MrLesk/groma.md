/**
 * The named icons an author can give an architecture element or a group, in the kinds of part they stand for. A
 * document stores only the name. A name says what kind of part something is in any architecture, never a product.
 * The web map draws each name as one small object beside the name it belongs to.
 */
export const ICON_KINDS = {
  people: ['person', 'admin', 'developer', 'agent', 'team', 'guest', 'support', 'organization'],
  clients: ['browser', 'mobile', 'desktop', 'terminal', 'chip', 'camera', 'laptop', 'display', 'device', 'router'],
  compute: ['service', 'server', 'worker', 'scheduler', 'cloud', 'function', 'pipeline', 'workflow', 'crate', 'sandbox', 'cluster', 'datacenter'],
  traffic: ['gateway', 'route', 'globe', 'cdn', 'network', 'balancer', 'firewall', 'dns', 'vpn'],
  data: ['database', 'cache', 'storage', 'backup', 'document', 'search', 'migration', 'disk', 'warehouse', 'table', 'directory', 'registry', 'log', 'feed', 'folder', 'index', 'vector', 'calendar'],
  messaging: ['mail', 'queue', 'stream', 'notification', 'webhook', 'broker', 'chat', 'inbox', 'broadcast'],
  security: ['lock', 'key', 'identity', 'certificate', 'shield', 'fingerprint', 'vault', 'policy'],
  watching: ['chart', 'gauge', 'pulse', 'dashboard', 'bug', 'eye', 'radar', 'funnel', 'trace', 'alert'],
  tooling: ['settings', 'plugin', 'integration', 'api', 'tools', 'blocks', 'repository', 'package', 'board', 'code', 'checklist', 'palette', 'form', 'edit', 'power', 'release', 'sync', 'download', 'cleanup', 'timer', 'wand', 'check', 'ticket', 'blueprint', 'upload', 'link', 'tag', 'book', 'test'],
  ai: ['model', 'ai'],
  media: ['image', 'video', 'play', 'location', 'audio', 'translate', 'map', 'home'],
  commerce: ['payment', 'store', 'cart', 'order', 'money', 'discount', 'delivery', 'pos', 'inventory', 'bank', 'contract'],
  shapes: ['layers', 'grid', 'cube', 'star', 'flag', 'trigger', 'core'],
} as const

export type IconName = (typeof ICON_KINDS)[keyof typeof ICON_KINDS][number]

const ICON_NAMES: readonly IconName[] = Object.values(ICON_KINDS).flat()

export function isIconName(value: unknown): value is IconName {
  return ICON_NAMES.includes(value as IconName)
}
