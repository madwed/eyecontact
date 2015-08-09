var express = require("express");
var app = express();
var server = require("http").Server(app);
var path = require("path");
// var logger = require("morgan");
var ExpressPeerServer = require("peer").ExpressPeerServer;

app.set("port", process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000);
app.set("ip", process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

// app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "../browser")));

app.get("/", function (req, res) { 
  res.sendFile(path.join(__dirname, "./index.html")); 
});

var options = {
    debug: process.env.NODE_ENV === "production" ? false : true
}
var peerServer = ExpressPeerServer(server, options);

var ids = [];
var onlineUsers = 0;

peerServer.on("connection", function () {
  onlineUsers++;
});

peerServer.on("disconnect", function (id) {
  onlineUsers--;
  var placeInLine = ids.indexOf(id);
  if(placeInLine !== -1){
    ids.splice(placeInLine, 1);
  }
});

app.use("/api", peerServer);

app.get("/env", function (req, res) {
  res.json({env: process.env.NODE_ENV});
});

app.get("/meet/:id", function (req, res) {
  var id = req.params.id;
  var message = {users: onlineUsers};
  if(ids.length > 0){
    var placeInLine = ids.indexOf(id)
    if(placeInLine !== 0){
      if(placeInLine !== -1){
        ids.splice(placeInLine, 1);
      }
      message.meet = ids.shift();
    }else{
      message.meet = "hold";
    }
  }else{
    ids.push(id);
    message.meet = "hold"
  }
  res.json(message);
});

server.listen(app.get("port"), app.get("ip"), function () {
  console.log("Server running at %s:%d", app.get("ip"), app.get("port"));
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


