// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express')        // call express
var app        = express()                 // define our app using express

var tingo = require('tingodb')();
var db = new tingo.Db(__dirname + '/db', {});

var stats = db.collection("bathroom")
setInterval(dummy_insert, 5000)

function dummy_insert() {
    stats.insert({
        "amonia": 20 + Math.random() * 100
      , "in": Math.random() * 20
      , "out": Math.random * 20
    })
    console.log("one sample added!")
}

// get port
var nconf = require("nconf")
nconf.argv().env()
var cfg_name = nconf.get("conf") || "conf.json"
nconf.file({ "file": cfg_name })
nconf.defaults({
	  "port": 8080
})
var port = nconf.get("port")

app.listen(port)

chalk = require("chalk")
console.log(chalk.yellow('Magic happens on port %d'), port)
