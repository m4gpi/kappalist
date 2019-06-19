const View = require('kappa-view-level')
const { EventEmitter } = require('events')
const Item = require('../actions/item')

module.exports = function Items (lvl) {
  const events = new EventEmitter()
  const ITEM_SUBLEVEL_NAMESPACE = `list!item!`

  return View(lvl, {
    map: function (msg) {
      const item = new Item(msg)
      if (!item.isValid()) return []
      return [
        [item.key, item.attributes]
      ]
    },
    indexed: function (msgs) {
      msgs.forEach((msg) => {
        const item = new Item(msg)
        if (!item.isValid()) return
        events.emit(item.key, item)
        events.emit('update', item.key, item)
      })
    },
    api: {
      get: function (core, key, callback) {
        this.ready(function () {
          const itemKey = [ITEM_SUBLEVEL_NAMESPACE, key].join('')
          lvl.get(itemKey, callback)
        })
      },
      all: function (core, cb) {
        this.ready(function () {
          const results = {}
          var stream = lvl.createReadStream({
            gt: 'list!item!' + '!',
            lt: 'list!item!' + '~'
          })

          stream.on('data', function (chunk) {
            console.log(chunk)
            if (chunk.key.match(ITEM_SUBLEVEL_NAMESPACE)) {
              var [ list, item, key ] = chunk.key.split('!')
              Object.assign(results, {
                [key]: chunk.value
              })
            }
          })

          stream.once('end', cb.bind(null, null, results))
          stream.once('error', cb)
        })
      }
    },
    events
  })
}
