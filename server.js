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

var stats = db.collection("room")
setInterval(inspect, 1000)


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
var id2skt = {}
var cnt = 0
var pick_cache = null
io.on("connection", function(socket) {
    var id = cnt
    cnt ++
    console.log("Client %d connected", id)
    id2skt[id] = socket
    socket.on("disconnect", function() {
        console.log("Client disconnected: %d, clear sockt @%d. ", id, id)
        delete id2skt[id]
    })
    socket.on("pick", function(params) {
        if(null != pick_cache) {
            console.log("Using cache...")
            socket.emit("pick", pick_cache)
            return
        }
        console.log("pick request: %s", JSON.stringify(params))
        var start = new Date(params["start"])
        var n = +params["cases"] + 1
        stats.find({ "ts": { "$gt": start } }).sort({ "ts": 1 }).limit(3600 * 24)
            .toArray(function(err, rec_list) {
                var steps = Math.ceil(rec_list.length / n)
                console.log("Sampling every %d cases", steps)
                var picked = []
                for(var i = 0; i < rec_list.length; i += steps) {
                    picked.push(rec_list[i])
                }
                pick_cache = { "picked": picked, "steps": steps }
                console.log("Start emitting picked list")
                socket.emit("pick", pick_cache)
            })
    })
    socket.on("pick_ack", function(data) {
        console.log("Client %d got history successfully", id)
    })
    /*stats.find().sort({"ts": 1}).limit(3600 * 5).toArray(function(err, records){
        socket.emit("history", records)
    })*/
})

var GPIO = require('onoff').Gpio
var led = new GPIO(18, 'out')
var led2 = new GPIO(22, 'out')
var pir1 = new GPIO(4, 'in', 'both')
var pir2 = new GPIO(27, 'in', 'both')
var input_people = 0
var output_people = 0
var pir1_state = 0
var pir2_state = 0

//define vars for i2c
var i2c = require('i2c')
var address = 0x48 
var wire = new i2c(address, {device: '/dev/i2c-1'})
var length = 2

function light(err, state) {
  
  // 1 == pressed, 0 == not pressed
  if(state == 1) {
    // turn LED on
    led.writeSync(1);

       if(pir2_state == 1)
    {
      
       output_people = output_people+1
       pir2_state = 0
    }
   else
    {pir1_state = 1; }
 
   console.log("motion detected!")
  } else {
    // turn LED off
    led.writeSync(0);
    pir1_state = 0;
  }
  
}

function light2(err, state) {
  
  // check the state of the button
  // 1 == pressed, 0 == not pressed
  if(state == 1) {
    // turn LED on
    led2.writeSync(1);
    if(pir1_state == 1)
    {
       //pir2_state = 1;
       input_people = input_people+1;
       pir1_state = 0;
    }
   else
    {pir2_state = 1; }
    
    console.log("...........................motion detected!")
  } 
}

// pass the callback function to the
// as the first argument to watch()
pir1.watch(light)
pir2.watch(light2)

function inspect() {
    //console.log("in = "+ input_people + " | out = " + output_people);
    //read analog sensor value
    wire.writeBytes(0x01, [0xC1,0x83], function(err,res) {
        //console.log("error write:"+err)
        if(err) {
            console.log("Failed to initiate i2c reading:\n\t " + err)
            return
        }
        wire.readBytes(0x00,length, function(err2, res) {
            if(err2) {
                console.log("Failed to retrieve i2c reading:\n\t " + err2)
                return
            }
            var conc = res.readInt16LE()
            var rec = { "conc": conc, "out": output_people, "in": input_people, "ts": new Date() }
            stats.insert(rec)
            // Iterate all sockets to all clients
            for(var id in id2skt) {
                id2skt[id].emit("latest", rec)
                //console.log("Latest %s sent to client %d", JSON.stringify(rec), id)
            }
        })
    })
}

