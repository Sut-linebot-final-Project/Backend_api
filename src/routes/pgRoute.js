const express = require("express");
const pgController = require("../controllers/pgController")

const router = express.Router();

router.get('/getHistorrGraph', pgController.getHistorrGraph);
router.get('/questionList', pgController.questionList);
router.post('/insertHistory', pgController.insertHistory);
router.post('/updateHistory', pgController.updateHistory);
router.post('/deleteQuestion', pgController.deleteQuestion);
router.post('/updateQuestion', pgController.updateQuestion);
router.get('/countRes', pgController.countRes);

;
module.exports = router