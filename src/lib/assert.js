class AssertionError extends Error {
  constructor (message) {
    super(message)
  }
}

module.exports = function assert (ok, message) {
  if (!ok) throw new AssertionError(message)
  else return true
}
