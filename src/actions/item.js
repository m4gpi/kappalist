const Action = require('./action')

module.exports = class Item extends Action {
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

