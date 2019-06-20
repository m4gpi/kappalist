const kappa = require('kappa-core')
const View = require('kappa-view-level')
const ram = require('random-access-memory')
const level = require('level')
const sublevel = require('subleveldown')
const memdb = require('memdb')
const { get } = require('lodash')

const core = kappa(ram, { valueEncoding: 'json' })
const lvl = level('./db')
const sub = sublevel(lvl, 'main', { valueEncoding: 'json' })
const animals = sublevel(sub, 'animals', { valueEncoding: 'json' })

animals.put('animal', 'dinosaur', () => {
  sub.createReadStream().on('data', console.log)
  // { key: '!animals!animal', value: 'dinosaur' }
})

// var view = {
//   map: function (msgs, next) {
//     var ops = []
//     msgs.forEach((msg) => {
//       const { key, seq, value } = msg

//       if (value && value.content && value.type === 'list/animal' && value.content.name) {
//         ops.push({
//           type: 'put',
//           key: 'animal!',
//           value: {
//             author: "@" + key,
//             ...value
//           }
//         })
//       }
//     })

//     console.log("APPENDING...", ops)
//     sub.batch(ops, next)
//   },
//   api: {
//     find: function (core, key, cb) {
//       this.ready(function () {
//         sub.get('animal!', cb)
//       })
//     },
//     where: function (core, props, cb) {
//       this.ready(function () {
//         const { feedId, name } = props
//         const animals = []
//         console.log("WHERE", props)

//         sub.createReadStream({
//           // gt: 'animal!!',
//           // lt: 'animal!~',
//           keys: false,
//           values: true
//         }).on('data', (animal) => {
//           console.log("ANIMAL", animal)
//           get(animal, 'content.name') && get(animal, 'author') === feedId
//             ? animals.push(animal)
//             : null
//         }).once('end', function () {
//           console.log("ANIMALS: ", animals)
//           cb(null, animals)
//         }).once('error', cb)
//       })
//     }
//   }
// }

// function Item (props) {
//   return {
//     type: 'list/animal',
//     content: props
//   }
// }

// core.use('animals', view)

// core.writer(function (err, feed) {
//   const feedId = feed.key.toString('hex')
//   console.log("MY_PUB_KEY: ", feedId)

//   feed.append(Item({ name: 'gargoyles' }))
//   feed.append(Item({ name: 'monkeys' }))
//   feed.append(Item({ name: 'monkeys' }))
//   feed.append(Item({ name: 'monkeys' }))
//   feed.append(Item({ name: 'elephants' }))
//   feed.append(Item({ name: 'peacocks' }))

//   setTimeout(() => {
//     core.ready('animals', function () {
//       core.api.animals.where({ feedId, name: 'monkeys' }, (err, animals) => {
//         // animals.forEach((animal) => console.log(animal))
//       })
//     })
//   }, 1000)
// })
