export function loadItems() {
  return fetch('/api/items')
}

export function loadNotes(item) {
  return fetch(`/api/items/${item}/notes`)
}

export function loadLate() {
  return fetch('/admin/late')
}
