class CustomError extends Error {
  constructor(
    message,
    { code, statusCode = 500, validationErrors = null } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.validationErrors = validationErrors;
  }
}

module.exports = CustomError;
