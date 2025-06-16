const { v4: uuidv4 } = require("uuid");
const userModel = require("../models/userModel");
const CustomError = require("../utils/customError");
const { ERROR_CODES, ERROR_MESSAGES } = require("../utils/constants");

exports.registerUser = (username, callback) => {
  if (!username || username.trim() === "") {
    return callback(
      new CustomError(ERROR_MESSAGES.USERNAME_REQUIRED, {
        statusCode: 400,
        code: ERROR_CODES.USERNAME_REQUIRED,
      })
    );
  }

  const id = uuidv4();
  userModel.createUser(id, username, (err) => {
    if (err) {
      return callback(
        new CustomError(ERROR_MESSAGES.USERNAME_NOT_UNIQUE, {
          statusCode: 400,
          code: ERROR_CODES.USERNAME_NOT_UNIQUE,
        })
      );
    }

    callback(null, { _id: id, username });
  });
};

exports.getUsers = (callback) => {
  userModel.getAllUsers((err, users) => {
    if (err) {
      return callback(
        new CustomError(ERROR_MESSAGES.DB_ERROR, {
          statusCode: 500,
          code: ERROR_CODES.DB_ERROR,
        })
      );
    }
    callback(null, users);
  });
};

exports.addExerciseToUser = (userId, data, callback) => {
  const { description, duration, date } = data;

  const errors = [];

  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return callback(
      new CustomError(ERROR_MESSAGES.USER_ID_REQUIRED, ERROR_CODES.USER_ID_REQUIRED, 400)
    );
  }

  if (
    !description ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    errors.push(ERROR_MESSAGES.MISSING_DESCRIPTION);
  }

  const parsedDuration = parseInt(duration);
  if (isNaN(parsedDuration) || parsedDuration <= 0) {
    errors.push(ERROR_MESSAGES.INVALID_DURATION);
  }

  let dateObj;
  if (!date) {
    dateObj = new Date();
  } else {
    dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      errors.push(ERROR_MESSAGES.INVALID_DATE);
    }
  }

  if (errors.length > 0) {
    return callback(
      new CustomError(ERROR_MESSAGES.VALIDATION_FAILED, {
        statusCode: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        validationErrors: errors,
      })
    );
  }

  const isoDate = dateObj.toISOString().split("T")[0];

  userModel.findUserById(userId, (err, user) => {
    if (err) {
      return callback(
        new CustomError(ERROR_MESSAGES.DB_ERROR, {
          statusCode: 500,
          code: ERROR_CODES.DB_ERROR,
        })
      );
    }
    if (!user) {
      return callback(
        new CustomError(ERROR_MESSAGES.USER_NOT_FOUND, {
          statusCode: 404,
          code: ERROR_CODES.USER_NOT_FOUND,
        })
      );
    }

    const exerciseId = uuidv4();

    userModel.createExercise(
      exerciseId,
      userId,
      description,
      parsedDuration,
      isoDate,
      (err2) => {
        if (err2) {
          return callback(
            new CustomError(ERROR_MESSAGES.DB_ERROR, {
              statusCode: 500,
              code: ERROR_CODES.DB_ERROR,
            })
          );
        }

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
    if (err) {
      return callback(
        new CustomError(ERROR_MESSAGES.DB_ERROR, {
          statusCode: 500,
          code: ERROR_CODES.DB_ERROR,
        })
      );
    }
    if (!user) {
      return callback(
        new CustomError(ERROR_MESSAGES.USER_NOT_FOUND, {
          statusCode: 404,
          code: ERROR_CODES.USER_NOT_FOUND,
        })
      );
    }

    let fromISO = from ? new Date(from).toISOString().split("T")[0] : null;
    let toISO = to ? new Date(to).toISOString().split("T")[0] : null;

    if (from) {
      const fromDate = new Date(from);
      if (isNaN(fromDate.getTime())) {
        return callback(
          new CustomError(ERROR_MESSAGES.INVALID_DATE, {
            statusCode: 400,
            code: ERROR_CODES.INVALID_DATE,
          })
        );
      }
      fromISO = fromDate.toISOString().split("T")[0];
    }

    if (to) {
      const toDate = new Date(to);
      if (isNaN(toDate.getTime())) {
        return callback(
          new CustomError(ERROR_MESSAGES.INVALID_DATE, {
            statusCode: 400,
            code: ERROR_CODES.INVALID_DATE,
          })
        );
      }
      toISO = toDate.toISOString().split("T")[0];
    }

    userModel.getUserExercises(
      userId,
      fromISO,
      toISO,
      (errCount, totalCount) => {
        if (errCount) {
          return callback(
            new CustomError(ERROR_MESSAGES.DB_ERROR, {
              statusCode: 500,
              code: ERROR_CODES.DB_ERROR,
            })
          );
        }

        userModel.getUserExercises(
          userId,
          fromISO,
          toISO,
          limit,
          (errLog, log) => {
            if (errLog) {
              return callback(
                new CustomError(ERROR_MESSAGES.DB_ERROR, {
                  statusCode: 500,
                  code: ERROR_CODES.DB_ERROR,
                })
              );
            }

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

exports.getExercisesForUser = (userId, callback) => {
  userModel.findUserById(userId, (err, user) => {
    if (err) {
      return callback(
        new CustomError(ERROR_MESSAGES.DB_ERROR, {
          statusCode: 500,
          code: ERROR_CODES.DB_ERROR,
        })
      );
    }
    if (!user) {
      return callback(
        new CustomError(ERROR_MESSAGES.USER_NOT_FOUND, {
          statusCode: 404,
          code: ERROR_CODES.USER_NOT_FOUND,
        })
      );
    }

    userModel.getUserExercises(userId, null, null, null, (err2, exercises) => {
      if (err2) {
        return callback(
          new CustomError(ERROR_MESSAGES.DB_ERROR, {
            statusCode: 500,
            code: ERROR_CODES.DB_ERROR,
          })
        );
      }

      const formatted = exercises.map((entry) => ({
        description: entry.description,
        duration: entry.duration,
        date: new Date(entry.date).toDateString(),
      }));

      callback(null, {
        _id: user.id,
        username: user.username,
        count: exercises.length,
        log: formatted,
      });
    });
  });
};
