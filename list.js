const level = require('level')
const sublevel = require('subleveldown')
const kappa = require('kappa-core')

const core = kappa('./kappalist', { valueEncoding: 'json' })
const db = level('./list')

const View = require('./view')

core.use('items', View(sublevel(db, 'items', { valueEncoding: 'json' })))

core.writer('local', function (err, feed) {
  core.ready('items', function () {
    seedData(() => {
      // Execute a query for all items, ordered in reverse by name and timestamp
      core.api.items.read({ reverse: true }, function (err, values) {
        console.log('values', values.map(v => v.value))
      })
    })
  })

  async function seedData (cb) {
    feed.append([
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
    ], cb)
  }
})
