'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

var config = require('./config');

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
    res.send('Hey! I am MR.Nbe :D')
});

// Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.VERIFY_TOKEN) {
    	console.log("Token validation success.")
        res.status(200).send(req.query['hub.challenge']);
    } else {
    	console.log("Token validation failed.")
    	res.sendStatus(403);
    }
});

// Listen for POST calls
app.post('/webhook', function (req, res) {
	var body = req.body;

	// Make sure this is a page subscription
	if (body.object === 'page') {
		body.entry.forEach(function(pageEntry) {
      		var pageID = pageEntry.id;
      		var timeOfEvent = pageEntry.time;

      		pageEntry.messaging.forEach(function(messagingEvent) {
      			if (messagingEvent.optin) {
        			console.log("messagingEvent : optin")

        		} else if (messagingEvent.message) {
        			console.log("messagingEvent : message")

        		} else if (messagingEvent.delivery) {
        			console.log("messagingEvent : delivery")

        		} else if (messagingEvent.postback) {
        			console.log("messagingEvent : postback")

        		} else if (messagingEvent.read) {
        			console.log("messagingEvent : read")
        			
        		} else {
          			console.log("Webhook received unknown messagingEvent : ", messagingEvent)
        		}
      		});
      	});

      	res.sendStatus(200);
	}
});

app.listen(app.get('port'), function() {
    console.log('Running NBE bot on port', app.get('port'))
});