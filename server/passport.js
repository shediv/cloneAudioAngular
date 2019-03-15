var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
const User = require('./models/User');
// Config
const config = require('./config');

passport.use(new LocalStrategy({
    usernameField: 'username'
  },
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      // Return if user not found in database
      if (!user) {
        return done(null, false, {
          message: 'Username not found..!!'
        });
      }
      
      // Return if password is wrong
      if (!user.validPassword(password)) {
        return done(null, false, {
          message: 'Please provide correct password..!!'
        });
      }
      // If credentials are correct, return the user object
      return done(null, user);
    });
  }
));