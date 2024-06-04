var version = "6.58.0";

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
		name: String,
		version: String,
		dps: Number,
		length: Number,
		gcd: Number,
		wd: Number,
		str: Number,
		dh: Number,
		crit: Number,
		det: Number,
		sks: Number,
		actions: [{i: String, d: String}]
	}, { strict: true });

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

	function sendNotFound(req, res) {
		var page = decodeURI(url.parse(req.url).pathname);
		res.setHeader("Content-Type", "text/plain");
		res.status(404).send("Not found: " + page);
	}

	function returnImage(req, res) {
		var page = decodeURI(url.parse(req.url).pathname);
		res.sendFile(page, { root: __dirname });
	}

	function returnFile(req, res) {
		var hasVersion = (req.params.a && req.params.b && req.params.c);
		var dir = __dirname + (hasVersion ? "" : `/version/${version}`);
		var page = decodeURI(url.parse(req.url).pathname);
		res.sendFile(page, { root: dir });
	}

	function loadRotation(req, res) {
		Rotation.findOne({ id: req.params.id }).exec(function (err, rot) {
			if (err) return console.error(err);
			res.setHeader("Content-Type", "application/json");
			res.send(rot);
		});
	}

	function saveRotation(req, res) {
		var newRot = new Rotation(req.body);
		Rotation.find().sort({ "id" : -1 }).exec(function (err, rot) {
			if (err) return console.error(err);
			var id = "0000";
			if (rot.length)
				id = getNextId(rot[0].id);

			newRot.id = id;

			newRot.save(function (err, rot) {
				if (err) return console.error(err);
				res.send(id);
			});
		});
	}

	function sendIndex(req, res) {
		var hasVersion = (req.params.a && req.params.b && req.params.c);
		if (req.params.id) {
			if (!hasVersion) {
				Rotation.findOne({ id: req.params.id }).exec(function (err, rot) {
					if (err) return console.error(err);
					if (rot == null) {
						sendNotFound(req, res);
						return;
					}

					if (rot.version != version) {
						res.redirect(`/version/${rot.version}/${req.params.id}`);
					} else {
						res.sendFile("index.html", { root: `${__dirname}/version/${version}` });
					}
				});
				return;
			}
		} else if (hasVersion && !decodeURI(url.parse(req.url).pathname).endsWith("/")) {
			res.redirect(`/version/${req.params.a}.${req.params.b}.${req.params.c}/`);
			return;
		}
		var dir = __dirname + "/version/" + (hasVersion ? `${req.params.a}.${req.params.b}.${req.params.c}` : version);
		res.sendFile("index.html", { root: dir });
	}

	app.get("/", sendIndex)
	.get("/images/:x", returnImage)
	.get("/images/effects/:x", returnImage)
	.get("/images/group/:x", returnImage)
	.get("/images/jobs/:x", returnImage)
	.get("/data.js", returnFile)
	.get("/drg_sim.css", returnFile)
	.get("/drg_sim.js", returnFile)
	.get("/lib.js", returnFile)
	.get("/theme_checkbox.js", returnFile)
	.get("/jquery.ui.touch-punch.js", returnFile)
	.get("/version/:a.:b.:c/", sendIndex)
	.get("/version/:a.:b.:c/data.js", returnFile)
	.get("/version/:a.:b.:c/drg_sim.css", returnFile)
	.get("/version/:a.:b.:c/drg_sim.js", returnFile)
	.get("/version/:a.:b.:c/lib.js", returnFile)
	.get("/version/:a.:b.:c/theme_checkbox.js", returnFile)
	.get("/version/:a.:b.:c/jquery.ui.touch-punch.js", returnFile)
	//.get("/favicon.ico", returnFile)
	.get("/:id", sendIndex)
	.get("/version/:a.:b.:c/:id", sendIndex)
	.post("/:id", loadRotation)
	.post("/", saveRotation)
	.use(function(req, res, next) {
		console.log("Shouldn't be here: " + req.url);
		sendNotFound(req, res);
	});

	app.listen(1379, "localhost");
	console.log("App started");
});