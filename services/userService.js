const { v4: uuidv4 } = require("uuid");
const userModel = require("../models/userModel");

exports.registerUser = (username, callback) => {
  if (!username || username.trim() === "") {
    return callback(new Error("Username is required"));
  }

  const id = uuidv4();
  userModel.createUser(id, username, (err) => {
    if (err) {
      return callback(new Error("Username must be unique"));
    }

    callback(null, { _id: id, username });
  });
};

exports.getUsers = (callback) => {
  userModel.getAllUsers((err, users) => {
    if (err) return callback(new Error("Failed to retrieve users"));
    callback(null, users);
  });
};

exports.addExerciseToUser = (userId, data, callback) => {
  const { description, duration, date } = data;

  const errors = [];

  if (!userId) {
    errors.push("Missing user ID, please provide a user ID!");
  }

  if (
    !description ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    errors.push("Description is required, please add a description!");
  }

  const parsedDuration = parseInt(duration);
  if (isNaN(parsedDuration) || parsedDuration <= 0) {
    errors.push("Duration must be a positive number");
  }

  if (!date) {
    errors.push("Date is required, please add a date!");
  } else {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      errors.push("Invalid date format, should be YYYY-MM-DD");
    }
  }

  if (errors.length > 0) {
    const validationError = new Error("Validation failed");
    validationError.validationErrors = errors;
    return callback(validationError);
  }

  const isoDate = dateObj.toISOString().split("T")[0];

  userModel.findUserById(userId, (err, user) => {
    if (err) return callback(new Error("Failed to fetch user"));
    if (!user) return callback(new Error("User not found"));

    const exerciseId = uuidv4();

    userModel.createExercise(
      exerciseId,
      userId,
      description,
      parsedDuration,
      isoDate,
      (err2) => {
        if (err2) return callback(new Error("Failed to add exercise"));

        callback(null, {
          _id: user.id,
          username: user.username,
          description,
          duration: parsedDuration,
          date: dateObj.toDateString(),
        });
      }
    );
  });
};

exports.getUserLogs = (userId, from, to, limit, callback) => {
  userModel.findUserById(userId, (err, user) => {
    if (err) return callback(new Error("Failed to retrieve user"));
    if (!user) return callback(new Error("User not found"));

    let fromISO = null;
    let toISO = null;

    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return callback(new Error("Invalid 'from' date"));
      }
      fromISO = fromDate.toISOString().split("T")[0];
    }

    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return callback(new Error("Invalid 'to' date"));
      }
      toISO = toDate.toISOString().split("T")[0];
    }

    userModel.countUserExercises(
      userId,
      fromISO,
      toISO,
      (errCount, totalCount) => {
        if (errCount) return callback(new Error("Failed to count exercises"));

        userModel.getUserExercises(
          userId,
          fromISO,
          toISO,
          limit,
          (errLog, log) => {
            if (errLog)
              return callback(new Error("Failed to fetch exercise logs"));

            const formattedLog = log.map((entry) => ({
              description: entry.description,
              duration: entry.duration,
              date: new Date(entry.date).toDateString(),
            }));

            callback(null, {
              _id: user.id,
              username: user.username,
              count: totalCount,
              log: formattedLog,
            });
          }
        );
      }
    );
  });
};
