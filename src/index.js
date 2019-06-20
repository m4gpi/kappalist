const path = require('path')
const os = require('os')
const fs = require('fs')

const kappa = require('kappa-core')
const level = require('level')
const sublevel = require('subleveldown')

const crypto = require('hypercore-crypto')
const { EventEmitter } = require('events')

const mkdirp = require('mkdirp')

const ListView = require('./views/items')
const ItemView = require('./views/items')

const APP_NAME = require('../package.json').name
const APP_ROOT = path.join(os.homedir(), `.${APP_NAME}`) 
const APP_CONFIG_PATH = `${APP_ROOT}/config.json`
const APP_CONFIG = require(APP_CONFIG_PATH)
const APP_GROUPS_PATH = `${APP_ROOT}/groups`

const GROUP_PATH = (key) => `${APP_GROUPS_PATH}/${key}`
const GROUP_VIEWS_PATH = (key) => `${GROUP_PATH(key)}/views`

var pubKey = process.argv[2]
if (!APP_CONFIG.groups.find((key) => key === pubKey)) {
  const keys = crypto.keyPair()
  pubKey = keys.publicKey.toString('hex')
  APP_CONFIG.groups.push(pubKey)
  fs.writeFileSync(APP_CONFIG_PATH, JSON.stringify(APP_CONFIG))
}

const core = kappa(GROUP_PATH(pubKey), { valueEncoding: 'json' })

console.log("PUBLIC KEY: ", pubKey)
mkdirp.sync(GROUP_VIEWS_PATH(pubKey))

const db = level(GROUP_VIEWS_PATH(pubKey))
core.use('lists', ListView(sublevel(db, 'lists', { valueEncoding: 'json' })))
core.use('items', ItemView(sublevel(db, 'items', { valueEncoding: 'json' })))

const list = {
  type: 'list',
  timestamp: Date.now(),
  content: {
    name: 'Legendary Creatures'
  }
}

const items = [
  {
    type: 'item',
    timestamp: Date.now(),
    content: {
      listId: 'a4081dda341597eba670f02f04795e1c42f628c663fb58c8b3b53f75c8a34016',
      name: 'Gargoyle'
    }
  },
  {
    type: 'item',
    timestamp: Date.now(),
    content: {
      listId: 'a4081dda341597eba670f02f04795e1c42f628c663fb58c8b3b53f75c8a34016',
      name: 'Dragon'
    }
  },
  {
    type: 'item',
    timestamp: Date.now(),
    content: {
      listId: 'a4081dda341597eba670f02f04795e1c42f628c663fb58c8b3b53f75c8a34016',
      name: 'Unicorn'
    }
  },
  {
    type: 'item',
    timestamp: Date.now(),
    content: {
      listId: 'a4081dda341597eba670f02f04795e1c42f628c663fb58c8b3b53f75c8a34016',
      name: 'Chimera'
    }
  }
]

core.writer('default', function (err, feed) {
  core.ready('lists', () => {
  })

  core.ready('items', () => {
    feed.append(items, (err, seq) => {
      core.api.items.all(console.log)
    })
  })
})

//   feed.append(item, () => {
//     // feed.append(Object.assign(item, { content: { name: 'bark' } }), (err) => {
//     var stream = feed.createReadStream({ start: 0, end: feed.length })
//     stream.on('data', (chunk) => console.log(chunk))
//     stream.once('end', () => console.log("DONE"))

//     core.ready('items', () => {
//       // core.api.items.get('5408b20d5d1c78f983e06b0242ca1ff68f8bbf9cbba7f60feb684c89bcaa920c', (err, value) => {
//       //   console.log(value)
//       // })
//       core.api.items.read({ gt: 'list!item!!', lt: 'list!item!~' }, function (err, items) {
//         if (err) throw err
//         console.log("ITEMS", items, "\n\n")
//       })
//     })
//     // })
//   })
