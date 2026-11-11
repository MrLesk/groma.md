export function listTickets() {
  return fetch('/api/json/desk/tickets')
}

export function readSchema() {
  return fetch('/api/json/desk/open_api')
}

export function loadLate() {
  return fetch('/api/json/desk/late')
}
