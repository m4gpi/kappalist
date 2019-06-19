const { EventEmitter } = require('events')

module.exports = class Action extends EventEmitter {
  constructor (props = {}) {
    super()
    this.id = props.key
    this.type = props.value && props.value.type
    this.attributes = props.value && props.value.content
    this.createdAt = props.value.timestamp
  }
}
