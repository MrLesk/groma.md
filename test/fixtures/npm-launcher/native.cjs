'use strict'

const fs = require('node:fs')
const [mode, resultFile, exitCode] = process.argv.slice(2)

if (mode === 'exit') process.exit(Number(exitCode))

setInterval(() => {}, 1000)

if (mode === 'handled') {
  let received = 0
  const close = signal => {
    received++
    if (received > 1) process.exit(99)
    // Model resource cleanup that must finish before the launcher exits.
    setTimeout(() => {
      fs.writeFileSync(resultFile, JSON.stringify({ signal, received }))
      process.exit(Number(exitCode))
    }, 100)
  }
  for (const signal of ['SIGTERM', 'SIGHUP', 'SIGQUIT', 'SIGINT']) process.on(signal, close)
}

console.log(JSON.stringify({ pid: process.pid }))
