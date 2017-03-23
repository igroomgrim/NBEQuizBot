'use strict'

const rqpm = require('request-promise')
const EventEmitter = require('events').EventEmitter
const Router = require('express').Router
const config = require('./config')

class Bot extends EventEmitter {
  constructor (options) {
    super()

    if (!options || !options.accessToken || !options.verifyToken) {
      throw new Error(`accessToken or verifyToken is can't be null`)
    }

    this.accessToken = options.accessToken
    this.verifyToken = options.verifyToken
    this.webhookPath = options.webhookPath || '/webhook/'
  }

  // Router
  router () {
    const router = Router()
    router.get('/', (req, res) => {
      res.status(200).send(`Hey! I am MR.NBE :D, you can say 'Hi' for wake me up.`)
    })

    router.get(this.webhookPath, (req, res) => {
      if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === this.verifyToken) {
        console.log('Verify facebook token success')
        res.status(200).send(req.query['hub.challenge'])
      } else {
        console.error('Failed validation. Make sure the validation tokens match.')
        res.sendStatus(403)
      }
    })

    router.post(this.webhookPath, (req, res) => {
      this.handleMessage(req)
      res.sendStatus(200)
    })

    return router
  }

  handleMessage (req) {
    const body = req.body
    if (body.object === 'page') {
      body.entry.forEach((pageEntry) => {
        pageEntry.messaging.forEach((messagingEvent) => {
          if (messagingEvent.message) {
            if (messagingEvent.message.is_echo) { return }

            if (messagingEvent.message.quick_reply) {
              _handleQuickReply.call(this, messagingEvent)
            }

            _handleUserMessage.call(this, messagingEvent)
          } else if (messagingEvent.postback) {
            _handlePostback.call(this, messagingEvent)
          } else {
            // console.log('Webhook received unused messagingEvent case ', messagingEvent)
          }
        })
      })
    } else {
      this.emit('error', new Error('body.object is not page'))
    }
  }
}

function _handleUserMessage (messagingEvent) {
  if (!messagingEvent.sender.id || !messagingEvent.message.text) {
    this.emit('error', new Error('_handleUserMessage : sender.id or message.text is null'))
  }

  this.emit('message', messagingEvent.sender.id, messagingEvent.message.text)
}

function _handlePostback (messagingEvent) {
  if (!messagingEvent.sender.id || !messagingEvent.postback.payload) {
    this.emit('error', new Error('_handlePostback : sender.id or postback.payload is null'))
  }

  this.emit('postback', messagingEvent.sender.id, messagingEvent.postback.payload)
}

function _handleQuickReply (messagingEvent) {
  if (!messagingEvent.sender.id || !messagingEvent.message.quick_reply.payload) {
    this.emit('error', new Error('_handleQuickReply : sender.id or quick_reply.payload is null'))
  }

  this.emit('quick_reply', messagingEvent.sender.id, messagingEvent.message.quick_reply.payload)
}

function _handleApiAIResponse (messagingEvent) {

}

module.exports = Bot
