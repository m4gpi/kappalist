var level = require('level')
var sublevel = require('subleveldown')
var kappa = require('kappa-core')
var ram = require('random-access-memory')
var list = require('kappa-view-list')

var core = kappa(ram, { valueEncoding: 'json'  })
var lvl = level('./list')
var idx = sublevel(lvl, 'items', { valueEncoding: 'json' })

var listIdx = list(idx, function (msg, next) {
  if (!msg.value.type === 'list/item') return next()
  next(null, [msg.value.content.name])
})

core.use('items', listIdx)

core.writer('local', function (err, feed) {
  core.ready('items', function () {
    var items = [
      {
        type: 'list/item',
        author: feed.key.toString('hex'),
        timestamp: Date.now(),
        content: {
          name: 'sunnies'
        }
      },
      {
        type: 'list/item',
        author: feed.key.toString('hex'),
        timestamp: Date.now(),
        content: {
          name: 'bells'
        }
      },
      {
        type: 'list/item',
        author: feed.key.toString('hex'),
        timestamp: Date.now(),
        content: {
          name: 'whistles'
        }
      }
    ]

    feed.append(items, function (err, seq) {
      core.api.items.read({}, function (err, values) {
        console.log('values', values)
      })
    })

    core.api.items.onInsert(function (msg) {
      console.log('update', msg.seq)
    })
  })
})
