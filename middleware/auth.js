const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
  // get token from the request header
  const token = req.header('x-auth-token');

  // check if there's no token
  if (!token) {
    return res.status(401).json('No token, Authorization denied!');
  }

  // decode the token and catch the error
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    req.user = decoded.user;
    next();
  } catch (err) {
    console.log(err.message);
    res.status(401).json({ msg: 'token is not valid' });
  }
};
