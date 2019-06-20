const View = require('kappa-view-level')

module.exports = function (ldb) {
  return View(ldb, {
    map: function (msg, next) {
      if (!sanitize(msg)) return []

      var mappings = []

      if (msg.value.type === 'list') {
        var key = 'list!about!' + msg.key
        var value = msg.value.content
        mappings.push([key, value])
      } else {
        mappings.push(['list!key!' + msg.key, 1])
      }

      return mappings
    },
    api: {
      get: function (core, key, cb) {
        this.ready(function () {
          ldb.get('list!about!' + key, cb)
        })
      },
      all: function (core, cb) {
        this.ready(function () {
          var res = {}
          ldb.createReadStream({
            gt: 'list!' + '!',
            lt: 'list!' + '~'

          }).on('data', function (row) {
            console.log(row)
            var parts = row.key.split('!')
            var key = parts[2]
            if (parts.length === 3 && parts[1] === 'about') {
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
    },
    storeState: function (state, cb) {
      state = state.toString('base64')
      ldb.put('state', state, cb)
    },
    fetchState: function (cb) {
      ldb.get('state', function (err, state) {
        if (err && err.notFound) cb()
        else if (err) cb(err)
        else cb(null, Buffer.from(state, 'base64'))
      })
    },
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
