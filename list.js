var level = require('level')
var sublevel = require('subleveldown')
var kappa = require('kappa-core')
var { EventEmitter } = require('events')
var through2 = require('through2')
var collect = require('collect-stream')

var core = kappa('./kappalist', { valueEncoding: 'json' })
var lvl = level('./list')

core.use('items', View(sublevel(lvl, 'items', { valueEncoding: 'json' })))

core.writer('local', function (err, feed) {
  core.ready('items', function () {
    var items = [
      {
        type: 'post',
        timestamp: Date.now(),
        content: {
          body: 'I love badgers'
        }
      },
      {
        type: 'list/item',
        timestamp: Date.now(),
        content: {
          name: 'sunnies'
        }
      },
      {
        type: 'list/item',
        timestamp: Date.now(),
        content: {
          name: 'bells'
        }
      },
      {
        type: 'list/item',
        timestamp: Date.now(),
        content: {
          name: 'whistles'
        }
      },
      {
        type: 'post',
        timestamp: Date.now(),
        content: {
          body: 'Arguing with squirrels makes my day'
        }
      },
      {
        type: 'list/item',
        timestamp: Date.now(),
        content: {
          name: 'whistles'
        }
      }
    ]

    feed.append(items, function (err, seq) {
      core.api.items.onInsert(function (msg) {
        console.log('SUCCESSFULLY INDEXED', msg)
      })
    })

    setTimeout(() => {
      core.api.items.read({ reverse: true }, function (err, values) {
        console.log('values', values)
      })
    }, 1000)
  })
})

function View (db, opts) {
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

        core.ready(() => {
          db.createReadStream(opts).pipe(through)
          collect(through, cb)
        })
      },
      onInsert: function (core, cb) {
        events.on('insert', cb)
      }
    },
    events
  }
}
