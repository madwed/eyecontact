var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var path = require("path"),
  logger = require("morgan");
var ExpressPeerServer = require("peer").ExpressPeerServer;

app.set("port", (process.env.PORT || 3000));

app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "../browser")));

app.get("/", function(req, res, next) { 
  res.sendFile(path.join(__dirname, "./index.html")); 
});

var options = {
    debug: true
}

app.use("/api", ExpressPeerServer(server, options));

var ids = [];

app.get("/env", function (req, res) {
  console.log(process.env.NODE_ENV);
  res.json({env: process.env.NODE_ENV});
});

app.get("/:id", function (req, res) {
  if(ids.length > 0){
    res.json({meet: ids.shift()});
  }else{
    ids.push(req.params.id);
    res.json({meet: "hold"});
  }
});

// var waitingUser;
// var line = 0;

// io.on("connection", function(socket){
//   socket.emit("env", process.env.NODE_ENV, app.get("port"));
//   socket.on("connectme", function(id){
//     if (line === 1) {
//       line = 0;
//       socket.emit("meet", waitingUser);
//     } else { // max two clients
//       line = 1;
//       waitingUser = id;
//       socket.emit("hold");
//     }
//   })

// });

server.listen(app.get("port"), function () {
  console.log("Server running at localhost: ", app.get("port"));
})

app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

app.use(function (err, req, res) {
    res.status(err.status || 500);
    console.log({error: err});
    res.send(err);
});


