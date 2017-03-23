'use strict'

const rqpm = require('request-promise')
const EventEmitter = require('events').EventEmitter
const Router = require('express').Router
const config = require('./config')
const apiai = require('apiai')

class Bot extends EventEmitter {
  constructor (options) {
    super()

    if (!options || !options.accessToken || !options.verifyToken) {
      throw new Error(`accessToken or verifyToken can't be null`)
    }

    if (!options.apiaiToken) {
      throw new Error(`api.ai token can't be null`)
    }

    this.accessToken = options.accessToken
    this.verifyToken = options.verifyToken
    this.webhookPath = options.webhookPath || '/webhook/'

    this.apiaiApp = apiai(options.apiaiToken)
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

    // Webhook for Facebook Messenger
    router.post(this.webhookPath, (req, res) => {
      this.handleMessage(req)
      res.sendStatus(200)
    })

    // Webhook for API.AI
    router.post('/apiai', (req, res) => {
      console.log(req.body.result)
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
              this.handleQuickReply(messagingEvent)
            }

            this.handleUserMessage(messagingEvent)
          } else if (messagingEvent.postback) {
            this.handlePostback(messagingEvent)
          } else {
            // console.log('Webhook received unused messagingEvent case ', messagingEvent)
          }
        })
      })
    } else {
      this.emit('error', new Error('body.object is not page'))
    }
  }

  handleUserMessage (messagingEvent) {
    if (!messagingEvent.sender.id || !messagingEvent.message.text) {
      this.emit('error', new Error('_handleUserMessage : sender.id or message.text is null'))
    }

    this.emit('message', messagingEvent.sender.id, messagingEvent.message.text)

    let senderID = messagingEvent.sender.id
    let text = messagingEvent.message.text

    let apiai = this.apiaiApp.textRequest(text, {
      sessionId: Math.random()
    })

    apiai.on('response', res => {
      this.handleApiAIResponse(senderID, res)
    })

    apiai.on('error', (error) => {
      console.log(error)
    })

    apiai.end()
  }

  handlePostback (messagingEvent) {
    if (!messagingEvent.sender.id || !messagingEvent.postback.payload) {
      this.emit('error', new Error('_handlePostback : sender.id or postback.payload is null'))
    }

    this.emit('postback', messagingEvent.sender.id, messagingEvent.postback.payload)
  }

  handleQuickReply (messagingEvent) {
    if (!messagingEvent.sender.id || !messagingEvent.message.quick_reply.payload) {
      this.emit('error', new Error('_handleQuickReply : sender.id or quick_reply.payload is null'))
    }

    this.emit('quick_reply', messagingEvent.sender.id, messagingEvent.message.quick_reply.payload)
  }

  handleApiAIResponse (senderID, res) {
    console.log('apiai response')
    console.log(res)
    console.log(`fulfilment : ${res.result.fulfillment.speech}`)

    let fulfillmentText = {
      text: res.result.fulfillment.speech
    }

    if (!res.result.fulfillment.speech) {
      fulfillmentText.text = "I can't understand what you say, Im so sorryy T.T"
    }

    this.sendMessageTo(senderID, fulfillmentText)
      .then(res => {
        console.log(`send fulfillment success`)
      })
      .catch(err => {
        console.log(`fulfillment ${err}`)
      })
  }

  async sendMessageTo (senderID, messageData) {
    const options = {
      method: 'POST',
      uri: config.FB_MESSENGER_API,
      qs: {
        access_token: this.accessToken
      },
      body: {
        recipient: { id: senderID },
        message: messageData
      },
      json: true
    }

    try {
      const response = await rqpm(options)
      return response
    } catch (error) {
      throw error
    }
  }
}

module.exports = Bot
