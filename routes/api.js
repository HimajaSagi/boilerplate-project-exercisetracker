const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/users", userController.createUser);
router.get("/users", userController.getAllUsers);
router.post("/users/:_id/exercises", userController.addExercise);
router.get("/users/:_id/exercises", userController.getExercises);
router.get("/users/:_id/logs", userController.getLogs);

module.exports = router;
