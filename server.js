// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express')        // call express
var app        = express()                 // define our app using express
app.use('/m', express.static("static"))
var http_server = require("http").createServer(app)

var io = require('socket.io')(http_server);

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

http_server.listen(port)

chalk = require("chalk")
console.log(chalk.yellow('Magic happens on port %d'), port)

// IO socket stuff
io.on("connection", function(socket) {
    socket.on("c2s", function(data) {
        console.log("Got client response: " + data)
    })
    var beat_id = setInterval(function() {
        socket.emit("s2c", Math.random() * 100)
    }, 1000)
    socket.on("disconnect", function() {
        console.log("Client disconnected! ")
        clearInterval(beat_id)
    })
})
