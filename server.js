const WebSocket = require('ws')
const { murmur2 } = require('murmurhash-js')

const buffers = require('./buffers')
const algorithm = require('./algorithm')
const Reader = require('./reader')
const Entity = require('./entity')

const SERVER_VERSION = '1.0.4'

const game = {
    url: '',
    protocolVersion: 0,
    clientVersion: 0
}

const user = {
    ws: null,
    bots: [],
    startedBots: false,
    stoppingBots: false,
    isAlive: false,
    mouseX: 0,
    mouseY: 0
}

const bots = {
    name: '',
    amount: 0,
    ai: false
}