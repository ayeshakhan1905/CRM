// global error handling middleware
module.exports = (err, req, res, next) => {
  // log stack if in development
  console.error(err.stack || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({ message });
};