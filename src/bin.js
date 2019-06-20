const yargs = require('yargs')

module.exports = function CLI (controller) {
  return yargs
    .command('add', 'add an item to your list', (yargs) => {
      yargs.positional('name', {
        demandOption: true,
        type: 'string'
      })
    }, (argv) => {
      const { name  } = argv
      controller.add({ name  }, callback)
    })

    .command('list', 'display your entire list', () => {
      controller.all(callback)
    })

    .argv
}

function callback (err, res) {
  if (err) throw err
}
