const View = require('kappa-view-level')

module.exports = function (lvl) {
  return View(lvl, {
    map: function (msg) {
      console.log(msg)
      if (!sanitize(msg)) return []

      var mappings = []

      if (msg.value.type === 'item') {
        var key = 'item!about!' + msg.key
        var value = msg.value.content
        mappings.push([key, value])
      } else {
        mappings.push(['item!key!' + msg.key, 1])
      }

      return mappings
    },
    api: {
      get: function (core, key, cb) {
        this.ready(function () {
          lvl.get('item!item!' + key, cb)
        })
      },
      all: function (core, cb) {
        this.ready(function () {
          var res = {}
          lvl.createReadStream({
            gt: 'item!' + '!',
            lt: 'item!' + '~'

          }).on('data', function (row) {
            var parts = row.key.split('!')
            var key = parts[2]
            if (parts.length === 3 && parts[1] === 'item') {
              if (!res[key]) res[key] = { key: key  }
              res[key].name = row.value.name
            } else if (!res[key]) {
              res[key] = {
                key: key
              }
            }
          }).once('end', cb.bind(null, null, res))
            .once('error', cb)
        })
      }
    }
  })
}

function sanitize (msg) {
  if (typeof msg !== 'object') return null
  if (typeof msg.value !== 'object') return null
  if (typeof msg.value.content !== 'object') return null
  if (typeof msg.value.timestamp !== 'number') return null
  if (typeof msg.value.type !== 'string') return null
  return msg
}
