const db = require("../db");

exports.createUser = (id, username, callback) => {
  const sql = "INSERT INTO users (id, username) VALUES (?, ?)";
  db.run(sql, [id, username], callback);
};

exports.getAllUsers = (callback) => {
  db.all("SELECT id AS _id, username FROM users", callback);
};

exports.findUserById = (id, callback) => {
  db.get("SELECT id, username FROM users WHERE id = ?", [id], callback);
};

exports.createExercise = (
  id,
  userId,
  description,
  duration,
  date,
  callback
) => {
  const sql = `INSERT INTO exercises (id, user_id, description, duration, date)
               VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [id, userId, description, duration, date], callback);
};

exports.getUserExercises = (userId, from, to, limit, callback) => {
  let query =
    "SELECT description, duration, date FROM exercises WHERE user_id = ?";
  const params = [userId];

  if (from) {
    query += " AND date >= ?";
    params.push(from);
  }

  if (to) {
    query += " AND date <= ?";
    params.push(to);
  }

  query += " ORDER BY date ASC";

  if (limit && !isNaN(parseInt(limit))) {
    query += " LIMIT ?";
    params.push(parseInt(limit));
  }

  db.all(query, params, callback);
};

exports.countUserExercises = (userId, from, to, callback) => {
  let query = "SELECT COUNT(*) AS count FROM exercises WHERE user_id = ?";
  const params = [userId];

  if (from) {
    query += " AND date >= ?";
    params.push(from);
  }

  if (to) {
    query += " AND date <= ?";
    params.push(to);
  }

  db.get(query, params, (err, row) => {
    if (err) return callback(err);
    callback(null, row.count);
  });
};
