export function loadItems() {
  return fetch('/api/items')
}

export function loadNote(item, note) {
  return fetch(`/api/items/${item}/notes/${note}`)
}

export function loadLate() {
  return fetch('/admin/late')
}
