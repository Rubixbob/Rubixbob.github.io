var express = require("express");
var bodyParser = require("body-parser");
var url = require("url");
var mongoose = require("mongoose");

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost/XivDrgSim", {useNewUrlParser: true});

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
	console.log("Connected to database");
	var rotationSchema = new mongoose.Schema({
		id: String,
		wd: Number,
		str: Number,
		dh: Number,
		crit: Number,
		det: Number,
		sks: Number,
		actions: [{i: String, d: String}]
	}, { strict: false });

	var Rotation = mongoose.model('Rotation', rotationSchema);

	function getNextId(id) {
		var oldIdCharCode = [];
		var newId = "";
		var increment = true;
		for (var i = id.length - 1; i >= 0; i--) {
			oldIdCharCode[i] = id.charCodeAt(i) >= 65 ? id.charCodeAt(i) - 55 : id.charCodeAt(i) - 48; // 48-57 65-90
			if (increment) {
				oldIdCharCode[i]++;
				if (oldIdCharCode[i] === 36)
					oldIdCharCode[i] = 0;
				else
					increment = false;
			}
			var newCharCode = oldIdCharCode[i] >= 10 ? oldIdCharCode[i] + 55 : oldIdCharCode[i] + 48;
			newId = String.fromCharCode(newCharCode) + newId;
		}
		return newId;
	}

	function generateNewId() {
		Rotation.findOne().sort({ "id" : -1 }).exec(function (err, rot) { // TODO: test sort
			if (err) return console.error(err);
			getNextId(rot.id);
		});
	}

	console.log(getNextId("0000"));
	console.log(getNextId("1234"));
	console.log(getNextId("1239"));
	console.log(getNextId("123A"));
	console.log(getNextId("123Z"));
	console.log(getNextId("12ZZ"));
	console.log(getNextId("1ZZZ"));
	console.log(getNextId("ZZZZ"));

	function returnFile(req, res) {
		var page = decodeURI(url.parse(req.url).pathname);
		res.sendFile(page, { root: __dirname });
	}

	function loadRotation(req, res) {
		Rotation.findOne({ id: req.params.id }).exec(function (err, rot) {
			if (err) return console.error(err);
			res.setHeader("Content-Type", "application/json");
			res.send(rot);
		});
	}

	function saveRotation(req, res) {
		var id = generateNewId();
		var rot = new Rotation(req.body);
		rot.save(function (err, rot) {
			if (err) return console.error(err);
		});
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
	//.get("/favicon.ico", returnFile)
	.get("/:id", loadRotation)
	.post("/", saveRotation)
	.use(function(req, res, next) {
		console.log("Shouldn't be here: " + req.url);
		var page = decodeURI(url.parse(req.url).pathname);
		res.setHeader("Content-Type", "text/plain");
		res.status(404).send("Not found: " + page);
	});

	app.listen(8080);
});