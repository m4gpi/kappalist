const path = require('path')
const os = require('os')
const fs = require('fs')

const kappa = require('kappa-core')
const View = require('kappa-view-level')
const level = require('level')
const sublevel = require('subleveldown')
const crypto = require('hypercore-crypto')
const { EventEmitter } = require('events')
const mkdirp = require('mkdirp')

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

mkdirp.sync(GROUP_VIEWS_PATH(pubKey))
const db = sublevel(level(GROUP_VIEWS_PATH(pubKey)), 'items', { valueEncoding: 'json' })

core.use('items', ItemView(db))

const item = {
  type: 'list/item',
  timestamp: Date.now(),
  content: {
    name: 'cheerios'
  }
}

core.writer('default', function (err, feed) {
  feed.append(item, () => {
    feed.append(Object.assign(item, { content: { name: 'bark' } }), (err) => {
      var stream = feed.createReadStream({ start: 0, end: feed.length })
      stream.on('data', (chunk) => console.log(chunk))
      stream.once('end', () => console.log("DONE"))

      // core.ready('items', () => {
      //   core.api.items.all(function (err, items) {
      //     if (err) throw err
      //     console.log(items)
      //   })
      // })
    })
  })
})
