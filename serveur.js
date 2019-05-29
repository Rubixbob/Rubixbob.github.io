var express = require("express");
var url = require("url");

var app = express();

app.get("/", function(req, res) {
	res.setHeader("Content-Type", "text/plain");
	res.send("Vous êtes à l'accueil");
})
.get("/:id", function(req, res) {
	res.setHeader("Content-Type", "text/plain");
	res.send("id: " + req.params.id);
})
.use(function(req, res, next) {
	var page = url.parse(req.url).pathname;
	res.setHeader("Content-Type", "text/plain");
	res.status(404).send('Page introuvable : ' + page);
});

app.listen(8080);