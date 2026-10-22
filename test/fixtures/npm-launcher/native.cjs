'use strict'

const fs = require('node:fs')
const [mode, ...args] = process.argv.slice(2)

if (mode === 'args') {
  console.log(JSON.stringify(args))
} else if (mode === 'exit') {
  process.exitCode = Number(args[0])
} else {
  const timer = setInterval(() => {}, 1000)
  let received = 0
  import('../../../src/cli-lifecycle.ts').then(({ stopOnSignal }) => {
    stopOnSignal(async () => {
      received++
      await Bun.sleep(50)
      clearInterval(timer)
      fs.writeFileSync(args[0], JSON.stringify({ received }))
      process.exitCode = 23
    })
    console.log(JSON.stringify({ pid: process.pid }))
  })
}
