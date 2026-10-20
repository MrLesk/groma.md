/** Ends a long-running command on Ctrl-C or SIGTERM once it has released what it holds. */
export function stopOnSignal(close: () => Promise<void>): void {
  let stopping = false
  const stop = () => {
    if (stopping) return
    stopping = true
    process.off('SIGINT', stop)
    void close().then(() => process.exit())
  }
  process.once('SIGINT', stop)
  // Group termination can also arrive through the npm launcher while close is pending.
  process.on('SIGTERM', stop)
}
