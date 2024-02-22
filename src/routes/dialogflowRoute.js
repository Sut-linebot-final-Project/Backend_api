const express = require("express");
const dialogflowController = require("../controllers/dialogflowController")

const router = express.Router();

router.get('/listIntent', dialogflowController.listIntent);
router.post('/addTrainingPhrases', dialogflowController.addTrainingPhrases)
router.post('/createIntent', dialogflowController.createIntent)
router.post('/editIntent', dialogflowController.editIntent)
router.post('/getIntent', dialogflowController.getIntent)

module.exports = router;
