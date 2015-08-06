var router = require("express").Router();
var path = require("path");

//Route that serves up the main page
router.get("/", function (req, res) {
	res.sendFile(path.join(__dirname, "../index.html"));
});


module.exports = router;