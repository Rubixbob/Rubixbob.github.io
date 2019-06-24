var express = require("express");
var url = require("url");
var mongoose = require("mongoose");

var app = express();

mongoose.connect("mongodb://localhost/db", {useNewUrlParser: true});

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
	console.log("We're connected!");
});

function returnFile(req, res) {
	var page = decodeURI(url.parse(req.url).pathname);
	res.sendFile(page, { root: __dirname });
}

function loadRotation(req, res) {
	res.setHeader("Content-Type", "text/plain");
	res.send("Not done yet, can't load " + req.params.id);
}

app.get("/", function(req, res) {
	res.sendFile("index.html", { root: __dirname });
})
.get("/images/:x", returnFile)
.get("/images/effects/:x", returnFile)
.get("/images/group/:x", returnFile)
.get("/images/jobs/:x", returnFile)
.get("/data.js", returnFile)
.get("/drg_sim.css", returnFile)
.get("/drg_sim.js", returnFile)
.get("/lib.js", returnFile)
.get("/:id", loadRotation)
.use(function(req, res, next) {
	console.log("Shouldn't be here: " + req.url);
	var page = decodeURI(url.parse(req.url).pathname);
	// console.log("Dans use : " + page);
	// res.sendFile(page, { root: __dirname });
	res.setHeader("Content-Type", "text/plain");
	res.status(404).send("Not found: " + page);
});

app.listen(8080);