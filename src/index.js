const path = require('path')
const os = require('os')

const kappa = require('kappa-core')
const View = require('kappa-view-level')
const level = require('level')
const sublevel = require('subleveldown')
const crypto = require('hypercore-crypto')
const { EventEmitter } = require('events')
const mkdirp = require('mkdirp')

// --------
// Location
// --------

const APP_NAME = require('../package.json').name
const APP_ROOT = path.join(os.homedir(), `.${APP_NAME}`) 
const APP_CONFIG = require(`${APP_ROOT}/config.json`)
const APP_GROUPS = `${APP_ROOT}/groups`

const GROUP = (key) => `${APP_GROUPS}/${key}`
const GROUP_VIEWS = (key) => `${GROUP(key)}/views`

// Application Structure
//
// kappalist
// ├── groups
// │   └── publicKey
// │       ├── 0 // feed
// │       │   ├── bitfield
// │       │   ├── data
// │       │   ├── key
// │       │   ├── localname
// │       │   ├── secret_key
// │       │   ├── signatures
// │       │   └── tree
// │       ├── 1 // feed
// │       │   ├── bitfield
// │       │   ├── data
// │       │   ├── key
// │       │   ├── signatures
// │       │   └── tree
// │       ├── _fake
// │       │   ├── bitfield
// │       │   ├── key
// │       │   ├── signatures
// │       │   └── tree
// │       └── views
// │           ├── 000033.ldb
// │           ├── 000035.log
// │           ├── CURRENT
// │           ├── LOCK
// │           ├── LOG
// │           ├── LOG.old
// │           └── MANIFEST-000034
// └── config.json

// -----
// Model
// -----

class Record extends EventEmitter {
  constructor (props = {}) {
    super()
    this.id = props.key
    this.type = props.value && props.value.type
    this.attributes = props.value && props.value.content
    this.createdAt = props.value.timestamp
  }
}

class Item extends Record {
  constructor (props = {}) {
    super(props)
    this._type = 'list/item'
    this._namespace = 'list!item!'
    this.key = [this._namespace, this.id].join('')

    this.isValid = this.isValid.bind(this)
  }

  isValid () {
    return typeof this.attributes === 'object' &&
      typeof this.createdAt === 'number' &&
      typeof this.type === 'string' &&
      this.type === this._type
  }
}

// ----
// View
// ----

function ItemView (lvl) {
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

          stream.on('data', function (row) {
            const match = row.key.match(ITEM_SUBLEVEL_NAMESPACE)
            if (match) {
              var [ list, item, key ] = row.key.split('!')
              Object.assign(results, {
                [key]: row.value
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

// ----------
// Initialize
// ----------

const keys = crypto.keyPair()
const pubKey = keys.publicKey.toString('hex')
const core = kappa(GROUP(pubKey), { valueEncoding: 'json' })

mkdirp(GROUP_VIEWS(pubKey), (err) => {
  const db = sublevel(level(GROUP_VIEWS(pubKey)), 'items', { valueEncoding: 'json' })

  core.use('items', 1, ItemView(db))

  const item = {
    type: 'list/item',
    timestamp: Date.now(),
    content: {
      name: 'cheerios'
    }
  }

  core.writer('default', function (err, feed) {
    feed.append(item, function (err) {
      core.api.items.all(function (err, items) {
        if (err) throw err
        console.log(items)
      })
    })
  })
})
