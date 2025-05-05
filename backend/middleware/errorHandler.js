// middleware/errorHandler.js
const errorHandler = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

module.exports = errorHandler;
