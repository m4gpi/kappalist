var through2 = require('through2')
var collect = require('collect-stream')
const { EventEmitter } = require('events')

module.exports = function View (db, opts) {
  const events = new EventEmitter()

  const putItem = (msg) => ({
    type: 'put',
    key: ['item!', msg.value.content.name, '!', msg.value.timestamp].join(''),
    value: [msg.key, '@', msg.seq].join('')
  })

  const getItem = (msg) => ({
    key: ['item!', msg.value.content.name, '!', msg.value.timestamp].join(''),
    value: [msg.key, '@', msg.seq].join('')
  })

  return {
    map: function map (msgs, next) {
      var mapped = msgs
        .filter((msg) => msg.value.type === 'list/item')
        .map(putItem)

      db.batch(mapped, next)
    },
    indexed: function indexed (msgs) {
      msgs
        .filter((msg) => msg.value.type === 'list/item')
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
