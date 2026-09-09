function Error(code, message) {
    this.statusCode = code,
    this.message = message;
}

module.exports = Error;