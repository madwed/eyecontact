"use strict";

var express = require("express"),
	path = require("path"),
	logger = require("morgan"),
	router = require(path.join(__dirname, "./routes"));

var app = express();

app.use(logger("dev"));
app.use(express.static(path.join(__dirname, "../browser")));

app.use("/", router);

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


module.exports = app;










