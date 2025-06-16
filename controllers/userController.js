const userService = require("../services/userService");
const { ERROR_CODES, ERROR_MESSAGES } = require("../utils/constants");

exports.createUser = (req, res) => {
  const username = req.body.username?.trim();
  if (!username)
    return res.status(400).json({ error: ERROR_MESSAGES.USERNAME_REQUIRED });

  userService.registerUser(username, (err, user) => {
    if (err) {
      switch (err.code) {
        case ERROR_CODES.USERNAME_NOT_UNIQUE:
          return res
            .status(400)
            .json({ error: ERROR_MESSAGES.USERNAME_NOT_UNIQUE });
        case ERROR_CODES.USERNAME_REQUIRED:
          return res
            .status(400)
            .json({ error: ERROR_MESSAGES.USERNAME_REQUIRED });
        default:
          return res.status(err.statusCode || 500).json({ error: err.message });
      }
    }
    res.json(user);
  });
};

exports.getAllUsers = (req, res) => {
  userService.getUsers((err, users) => {
    if (err) {
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
    res.json(users);
  });
};

exports.addExercise = (req, res) => {
  const userId = req.params._id?.trim();

  if (!userId) {
    return res.status(400).json({ error: "User ID is required in the URL" });
  }
  userService.addExerciseToUser(userId, req.body, (err, exercise) => {
    if (err) {
      if (err.code === ERROR_CODES.USER_NOT_FOUND) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }
      if (
        err.code === ERROR_CODES.VALIDATION_ERROR &&
        Array.isArray(err.validationErrors)
      ) {
        return res.status(400).json({ errors: err.validationErrors });
      }
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
    res.json(exercise);
  });
};

exports.getLogs = (req, res) => {
  const { from, to, limit } = req.query;
  userService.getUserLogs(req.params._id, from, to, limit, (err, result) => {
    if (err) {
      if (err.code === ERROR_CODES.USER_NOT_FOUND) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }
      if (err.code === ERROR_CODES.INVALID_DATE) {
        return res.status(400).json({ error: ERROR_MESSAGES.INVALID_DATE });
      }
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
    res.json(result);
  });
};

exports.getExercises = (req, res) => {
  userService.getExercisesForUser(req.params._id, (err, result) => {
    if (err) {
      if (err.code === ERROR_CODES.USER_NOT_FOUND) {
        return res.status(404).json({ error: ERROR_MESSAGES.USER_NOT_FOUND });
      }
      return res.status(err.statusCode || 500).json({ error: err.message });
    }
    res.json(result);
  });
};
