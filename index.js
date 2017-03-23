'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const config = require('./config')
const app = express()

const Bot = require('./bot')
const bot = new Bot({
  verifyToken: config.FB_VERIFY_TOKEN,
  accessToken: process.env.FB_PAGE_ACCESS_TOKEN
})

app.set('port', (process.env.PORT || config.PORT))

app.use(bodyParser.urlencoded({extended: false}))

app.use(bodyParser.json())

app.use(bot.router())

bot.on('message', (senderID, message) => {
  console.log(`fbbot message ${senderID} ${message}`)
})

bot.on('postback', (senderID, payload) => {
  console.log(`fbbot postback : ${senderID} ${payload}`)
})

bot.on('quick_reply', (senderID, payload) => {
  console.log(`fbbot quick_reply : ${senderID} ${payload}`)
})

bot.on('api_ai', (senderID, intent) => {
  console.log(`data from api.ai : ${intent}`)
})

bot.on('error', (error) => {
  console.log('fbbot on error', error)
})

app.listen(app.get('port'), () => {
  console.log(`Running Omise CoolGlasses bot on port : ${app.get('port')}`)
})
