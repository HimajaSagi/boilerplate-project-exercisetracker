const userService = require("../services/userService");

exports.createUser = (req, res) => {
  const username = req.body.username?.trim();
  if (!username) return res.status(400).send("Username is required");

  userService.registerUser(username, (err, user) => {
    if (err) {
      if (err.message.toLowerCase().includes("unique")) {
        return res.status(400).json({ error: "Username must be unique" });
      }
      return res.status(500).json({ error: "Database error: " + err.message });
    }
    res.json(user);
  });
};

exports.getAllUsers = (req, res) => {
  userService.getUsers((err, users) => {
    if (err) return res.status(500).send("Failed to retrieve users");
    res.json(users);
  });
};

exports.addExercise = (req, res) => {
  userService.addExerciseToUser(req.params._id, req.body, (err, exercise) => {
    if (err) {
      if (err.message === "User not found") {
        return res.status(404).json({ error: "User not found" });
      }

      if (err.validationErrors && Array.isArray(err.validationErrors)) {
        return res.status(400).json({ errors: err.validationErrors });
      }

      if (
        err.message === "Description is required" ||
        err.message === "Duration must be a positive number" ||
        err.message === "Invalid date format"
      ) {
        return res.status(400).json({ error: err.message });
      }

      return res
        .status(500)
        .json({ error: "Failed to add exercise: " + err.message });
    }

    res.json(exercise);
  });
};

exports.getLogs = (req, res) => {
  const { from, to, limit } = req.query;
  userService.getUserLogs(req.params._id, from, to, limit, (err, result) => {
    if (err?.message === "User not found")
      return res.status(404).send("User not found");
    if (err) return res.status(500).send("Failed to get logs");
    res.json(result);
  });
};
