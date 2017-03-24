var express = require("express");
var app = express();
var server = require("http").Server(app);
var path = require("path");
var Q = require("./queue");
var q = new Q;
// var logger = require("morgan");
var ExpressPeerServer = require("peer").ExpressPeerServer;

app.set("port", process.env.PORT || 3000);

// app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "../browser")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "./index.html"));
});

var options = {
    debug: process.env.NODE_ENV !== "production"
};
var peerServer = ExpressPeerServer(server, options);

peerServer.on("connection", function (id) {
  q.logon(id)
});

peerServer.on("disconnect", function (id) {
  q.logout(id);
});

app.use("/api", peerServer);

app.get("/env", function (req, res) {
  res.json({env: process.env.NODE_ENV});
});

app.get("/meet/:id", function (req, res) {
  var id = req.params.id;
  res.json(q.checkin(id));
});

server.listen(app.get("port"), app.get("ip"), function () {
  console.log("Server running at %s:%d", app.get("ip"), app.get("port"));
});

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

