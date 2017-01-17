'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

var config = require('./config');

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hey! I am MR.Nbe :D')
})

// Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === config.VERIFY_TOKEN) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.listen(app.get('port'), function() {
    console.log('Running NBE bot on port', app.get('port'))
})