// catch 404 and forward to error handler
module.exports = (req, res, next) => {
  res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
};