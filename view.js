var through2 = require('through2')
var collect = require('collect-stream')
const { EventEmitter } = require('events')

const MESSAGE_TYPE = 'list/item'
const NAMESPACE = 'item!'

module.exports = function View (db, opts) {
  const events = new EventEmitter()

  // This view creates an index of all items,
  // stores them in a sublevel namespaced first with 'item!'
  // and orders first by name, then by timestamp

  const putItem = (msg) => ({
    type: 'put',
    key: [NAMESPACE, msg.value.content.name, '!', msg.value.timestamp].join(''),
    value: [msg.key, '@', msg.seq].join('')
  })

  const getItem = (msg) => ({
    key: [NAMESPACE, msg.value.content.name, '!', msg.value.timestamp].join(''),
    value: [msg.key, '@', msg.seq].join('')
  })

  return {
    map: function map (msgs, next) {
      var mapped = msgs
        .filter((msg) => msg.value.type === MESSAGE_TYPE)
        .map(putItem)

      db.batch(mapped, next)
    },
    indexed: function indexed (msgs) {
      msgs
        .filter((msg) => msg.value.type === MESSAGE_TYPE)
        .map(getItem)
        .forEach((msg) => events.emit('insert', msg))
    },
    api: {
      read: function read (core, opts, cb) {
        if (typeof opts === 'function' && !cb) return read(core, {}, opts)
        if (!cb) cb = () => {}

        const through = through2.obj(function (entry, _, next) {
          var id = entry.value
          var feed = core._logs.feed(id.split('@')[0])
          var seq = Number(id.split('@')[1])

          feed.get(seq, function (err, value) {
            if (err) return next(err)
            next(null, {
              key: feed.key.toString('hex'),
              seq: seq,
              value: value
            })
          })
        })

        db.createReadStream(opts).pipe(through)
        collect(through, cb)
      },
      onInsert: function (core, cb) {
        events.on('insert', cb)
      }
    },
    events
  }
}
