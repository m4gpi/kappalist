const View = require('kappa-view-list')
const { EventEmitter } = require('events')
const Item = require('../actions/item')

const ITEM_SUBLEVEL_NAMESPACE = `list!item!`
const ITEM_TYPE = 'list/item'

module.exports = function Items (lvl) {
  const events = new EventEmitter()

  return View(lvl, function (msg, next) {
    if (msg.value.type !== ITEM_TYPE) return next()
    var content = msg.value.content
    next(null, [ITEM_SUBLEVEL_NAMESPACE, content])
  })
      // // var mappings = []

      // // if (msg.value.type === ITEM_TYPE) {
      // //   var value = msg.value.content
      // //   mappings.push([ITEM_SUBLEVEL_NAMESPACE + msg.key, value])
      // // } else {
      // //   mappings.push([ITEM_SUBLEVEL_NAMESPACE + msg.key, 1])
      // // }

      // // return mappings
      // console.log("MAP: ", msg, "\n\n")
      // const item = new Item(msg)
      // if (!item.isValid()) return [[]]
      // return [
      //   [ item.key, item.attributes ]
      // ]
    // },
    // indexed: function (msgs) {
      // console.log("INDEXED: ", msgs, "\n\n")
      // // msgs.forEach((msg) => {
      // //   const item = new Item(msg)
      // //   if (!item.isValid()) return
      // //   events.emit(item.key, item)
      // //   events.emit('update', item.key, item)
      // // })
    // },
    // api: {
      // get: function (core, key, callback) {
      //   this.ready(function () {
      //     const itemKey = [ITEM_SUBLEVEL_NAMESPACE, key].join('')
      //     lvl.get(itemKey, callback)
      //   })
      // },
      // all: function (core, cb) {
      //   this.ready(function () {
      //     const results = []
      //     lvl.createReadStream({
      //       gt: ITEM_SUBLEVEL_NAMESPACE + '!',
      //       lt: ITEM_SUBLEVEL_NAMESPACE + '~'
      //     }).on('data', function (chunk) {
      //       console.log("CHUNK: ", chunk, "\n\n")
      //       if (chunk.key.match(ITEM_SUBLEVEL_NAMESPACE)) {
      //         var [ list, item, key ] = chunk.key.split('!')
      //         results.push({ key, value: chunk.value })
      //       }
      //     }).once('end', cb.bind(null, null, results))
      //       .once('error', cb)
      //   })
      // }
    // },
    // fetchState: function (cb) { },
    // storeState: function (state, cb) {
      // console.log("STATE", state)
    // },
    // events
  // })
}
