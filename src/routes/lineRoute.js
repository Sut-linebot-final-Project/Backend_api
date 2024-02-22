const express = require("express");
const lineController = require("../controllers/lineController")

const router = express.Router();

router.post('/createUserLine', lineController.createUserLine)
router.post('/getUserLine', lineController.getUserLine)
module.exports = router;