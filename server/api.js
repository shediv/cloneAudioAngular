/*
 |--------------------------------------
 | Dependencies
 |--------------------------------------
 */

const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
var passport = require('passport');
const Event = require('./models/Event');
const Rsvp = require('./models/Rsvp');
const User = require('./models/User');
const AudioTextFile = require('./models/audioTextFiles');
var async = require('async');

// [SH] Bring in the Passport config after model is defined
require('./passport');
// Config
const config = require('./config');

//Muter Requirements
const multer = require('multer');

//Multer config
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
var upload = multer({ storage: storage })

/*
 |--------------------------------------
 | Authentication Middleware
 |--------------------------------------
 */

module.exports = function(app, config) {
  // Authentication middlewares
  // Check for an authenticated admin user
  const adminCheck = (req, res, next) => {
    const roles = req.user[config.NAMESPACE] || [];
    if (roles.indexOf('admin') > -1) {
      next();
    } else {
      res.status(401).send({message: 'Not authorized for admin access'});
    }
  }

  //JWT Token Auth
  var auth = jwt({
    secret: config.secret,
    userProperty: 'payload'
  });

/*
 |--------------------------------------
 | API Routes
 |--------------------------------------
 */

  const _eventListProjection = 'title startDatetime endDatetime viewPublic';

  // GET API root
  app.get('/api/', (req, res) => {
    res.send('API works');
  });

  // GET API root
  app.get('/api/testAuth', auth, (req, res) => {
    if (!req.payload._id) {
	    res.status(401).json({
	      message : constants.constUnAuthorizedAccess
	    });
	  } else {
      return res.status(200).send({message: req.payload });
    }
  });

  // GET userInfo API
  app.get('/api/userInfo', auth, (req, res) => {
    if (!req.payload._id) {
	    res.status(401).json({
	      message : 'Not Authorised'
	    });
	  } else {
      async.parallel({
        userDetails: function(callbackInner) {
          User.findOne({ _id : req.payload._id}, { audios : 1 }).lean().exec(function(errUser, userDetails){
                callbackInner(errUser, userDetails);
            });
        },
        audioTextFiles: function(callbackInner) {
          AudioTextFile.find({}).lean().exec(function(errAudText, audioTexts){                                                                                                                            
                callbackInner(errAudText, audioTexts);
            });
        }
      },
      function(err, results) {
        //If User has recorded audio
        if(results.userDetails.audios && results.userDetails.audios.length){
          //Filter the text user already recorded audio for
          results.audioTextFiles = results.audioTextFiles.filter(firstArrayItem =>
            !results.userDetails.audios.some(
              secondArrayItem => firstArrayItem.id === secondArrayItem.audioTextId
            )
          );
          return res.status(200).json({ audioTextFiles: results.audioTextFiles, userDetails: results.userDetails });
        }else{
          return res.status(200).json({ audioTextFiles: results.audioTextFiles, userDetails: results.userDetails });
        }
        
      });
    }
  });

  //Upload a audio file
  app.post('/api/uploadfile/:audioTextId', auth, upload.single('file'), (req, res, next) => {
    if (!req.payload._id) {
	    res.status(401).json({
	      message : 'Not Authorised'
	    });
	  } else {
      let file = req.file
      if(!file){
        return res.status(400).send({ error: 'Please upload a file' });  
      }
      file.audioTextId = parseInt(req.params.audioTextId);
      User.update({ _id : req.payload._id}, { $push: { audios: file } }).exec();
      return res.status(200).send({message: file });
    }
  })

  // GET list of public events starting in the future
  app.get('/api/events', (req, res) => {
    Event.find({viewPublic: true, startDatetime: { $gte: new Date() }},
      _eventListProjection, (err, events) => {
        let eventsArr = [];
        if (err) {
          return res.status(500).send({message: err.message});
        }
        if (events) {
          events.forEach(event => {
            eventsArr.push(event);
          });
        }
        res.send(eventsArr);
      }
    );
  });

  // Add a new user
  app.post('/api/user/register', (req, res) => {
    User.findOne({ username: req.body.username }, (err, existingUser) => {
      if (err) {
        return res.status(500).send({message: err.message});
      }
      if (existingUser) {
        return res.status(409).send({message: 'User Already Registered'});
      }
      var newUser = new User();
      newUser.username = req.body.username;
      newUser.firstName = req.body.firstName;
			newUser.lastName = req.body.lastName;
      newUser.isActive = true;
      newUser.setPassword(req.body.password);
      newUser.save((err) => {
        if (err) {
          return res.status(500).send({message: err});
        }
        res.send(newUser);
      });
    });
  });

  // Sign In API
  app.post('/api/user/signin', (req, res) => {
    passport.authenticate('local', function(err, user, info){
	    var token;
	    // If Passport throws/catches an error
	    if (err) {
	      res.status(404).json(err);
	      return;
	    }

	    // If a user is found
	    if(user){
	    	token = user.generateJwt();
		    res.status(200);
		    res.json({
            token : token
		    });  
	    } else {
	      // If user is not found
	      res.status(401).json(info);
	    }

	  })(req, res);
  });
};
