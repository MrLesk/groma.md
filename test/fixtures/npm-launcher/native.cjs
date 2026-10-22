'use strict'

const fs = require('node:fs')
const [mode, resultFile, exitCode] = process.argv.slice(2)

if (mode === 'args') {
  console.log(JSON.stringify(process.argv.slice(3)))
  process.exit(0)
}
if (mode === 'exit') process.exit(Number(exitCode))

setInterval(() => {}, 1000)
let received = 0
async function close(signal) {
  received++
  if (received > 1) process.exit(99)
  // Model resource cleanup that must finish before the launcher exits.
  await new Promise(resolve => setTimeout(resolve, 250))
  fs.writeFileSync(resultFile, JSON.stringify({ signal, received }))
  process.exitCode = Number(exitCode)
}

function ready() {
  console.log(JSON.stringify({ pid: process.pid }))
}

if (mode === 'groma') {
  // Run the actual native CLI owner under Bun, including its asynchronous close boundary.
  import('../../../src/cli-lifecycle.ts').then(({ stopOnSignal }) => {
    stopOnSignal(() => close())
    ready()
  })
} else {
  if (mode === 'handled') {
    for (const signal of ['SIGTERM', 'SIGHUP', 'SIGQUIT', 'SIGINT']) {
      process.on(signal, () => { void close(signal).then(() => process.exit()) })
    }
  }
  ready()
}
