const crypto = require('crypto');

function token() {
  return crypto.randomBytes(8).toString('hex');
}

module.exports = token;
