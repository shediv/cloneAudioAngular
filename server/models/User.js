/*
 |--------------------------------------
 | User Model
 |--------------------------------------
 */

const mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
// Config
const config = require('../config');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isActive: { type: Boolean},
  hash: { type: String, required: true },
  salt: { type: String, required: true },
  audios: { type: Array },
  texts: { type: Array }
});

userSchema.methods.setPassword = function(password) {  
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, config.algorithm).toString('hex');
};

userSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
  return this.hash === hash;
};

userSchema.methods.generateJwt = function() {
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + config.tokenExpireInDays);
  return jwt.sign({
      _id: this._id,
      username: this.username,
      exp: parseInt(expiry.getTime() / 1000),
  }, config.secret);
};

module.exports = mongoose.model('user', userSchema);
