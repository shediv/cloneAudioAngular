/*
 |--------------------------------------
 | Dependencies
 |--------------------------------------
 */

const jwt = require('express-jwt');
var mongoose = require('mongoose');
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
          User.aggregate([
            {$match: {_id: mongoose.Types.ObjectId(req.payload._id)}},
            {$unwind:"$audios"},
            {$lookup: {
                from: "audiotextfiles", 
                localField: "audios.audioTextId", 
                foreignField: "_id", 
                as: 'audioInfo'}},
            {$unwind:"$audioInfo"},    
            {$project:{
                "_id":1,
                "username": 1,
                "audios":[{
                    "filename":"$audios.filename",
                    "path":"$audios.path",
                    "mimetype":"$audios.mimetype",
                    "createdAt":"$audios.createdAt",
                    "audioInfo":"$audioInfo"            
                }]            
            }},
            {$unwind:"$audios"}
          ]).exec(function(errUser, userDetails){
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
        if(results.userDetails && results.userDetails.length){
          //Filter the text user already recorded audio for
          results.audioTextFiles = results.audioTextFiles.filter(d => !results.userDetails.some(o => d._id.toString() === o.audios.audioInfo._id.toString()));
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

      //Check if audioTextId is passed
      if(req.params.audioTextId !== undefined){
        file.audioTextId = mongoose.Types.ObjectId(req.params.audioTextId)
        file.createdAt = new Date();
        User.update({ _id : req.payload._id}, { $push: { audios: file } }).exec();
        return res.status(200).send({message: file });
      }else{
        return res.status(400).send({ error: 'Audio Text Id is not passed' });  
      }
    }
  })

  //Delete a recorded audio
  app.delete('/api/deleteAudio/:audioId', auth, (req, res) => {
    if (!req.payload._id) {
	    res.status(401).json({
	      message : 'Not Authorised'
	    });
	  } else {
      User.update({ _id: req.payload._id }, { "$pull": { "audios": { "audioTextId": mongoose.Types.ObjectId(req.params.audioId) } }}, { safe: true, multi: true }, function(errUser, userAudioData) {
        if(errUser){
          return res.status(400).send({ error: 'There was a error deleting audio file' });  
        }else{
          return res.status(200).json({ data: userAudioData });
        }
      });
    }
  })

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

  // Upload a text for user
  app.post('/api/user/uploadText', auth, (req, res) => {
    if (!req.payload._id) {
	    res.status(401).json({
	      message : 'Not Authorised'
	    });
	  } else {
      User.update({ _id : req.payload._id}, { $push: { texts: req.body.userText } }, function(errUpdateText, userUpdatedText){
        if(errUpdateText) return res.status(200).send({ errUpdateText: errUpdateText });
        return res.status(200).send({userUpdatedText: userUpdatedText });
      })

    }
  })

};
