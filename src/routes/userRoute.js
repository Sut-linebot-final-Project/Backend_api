const express = require("express");
const userController = require("../controllers/userController")

const router = express.Router();

router.post('/login', userController.login);
router.get('/getUser', userController.getUSer)
router.post('/getuserByID', userController.getuserByID)
router.post('/createUser', userController.createUser)
router.post('/updateUser', userController.updateUser)

module.exports = router;
