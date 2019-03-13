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
  // Authentication middleware
  // const jwtCheck = jwt({
  //   secret: jwks.expressJwtSecret({
  //     cache: true,
  //     rateLimit: true,
  //     jwksRequestsPerMinute: 5,
  //     jwksUri: `https://${config.AUTH0_DOMAIN}/.well-known/jwks.json`
  //   }),
  //   audience: config.AUTH0_API_AUDIENCE,
  //   issuer: `https://${config.AUTH0_DOMAIN}/`,
  //   algorithm: 'RS256'
  // });

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

  //Upload a audio file
  app.post('/api/uploadfile', upload.single('file'), (req, res, next) => {
    console.log(" ===== req =======", req);
    const file = req.file
    if (!file) {
      const error = new Error('Please upload a file')
      error.httpStatusCode = 400
      return next(error)
  
    }
      res.send(file)
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

  // // GET list of all events, public and private (admin only)
  // app.get('/api/events/admin', jwtCheck, adminCheck, (req, res) => {
  //   Event.find({}, _eventListProjection, (err, events) => {
  //       let eventsArr = [];
  //       if (err) {
  //         return res.status(500).send({message: err.message});
  //       }
  //       if (events) {
  //         events.forEach(event => {
  //           eventsArr.push(event);
  //         });
  //       }
  //       res.send(eventsArr);
  //     }
  //   );
  // });

  // // GET event by event ID
  // app.get('/api/event/:id', jwtCheck, (req, res) => {
  //   Event.findById(req.params.id, (err, event) => {
  //     if (err) {
  //       return res.status(500).send({message: err.message});
  //     }
  //     if (!event) {
  //       return res.status(400).send({message: 'Event not found.'});
  //     }
  //     res.send(event);
  //   });
  // });

  // // GET RSVPs by event ID
  // app.get('/api/event/:eventId/rsvps', jwtCheck, (req, res) => {
  //   Rsvp.find({eventId: req.params.eventId}, (err, rsvps) => {
  //     let rsvpsArr = [];
  //     if (err) {
  //       return res.status(500).send({message: err.message});
  //     }
  //     if (rsvps) {
  //       rsvps.forEach(rsvp => {
  //         rsvpsArr.push(rsvp);
  //       });
  //     }
  //     res.send(rsvpsArr);
  //   });
  // });

  // // GET list of upcoming events user has RSVPed to
  // app.get('/api/events/:userId', jwtCheck, (req, res) => {
  //   Rsvp.find({userId: req.params.userId}, 'eventId', (err, rsvps) => {
  //     const _eventIdsArr = rsvps.map(rsvp => rsvp.eventId);
  //     const _rsvpEventsProjection = 'title startDatetime endDatetime';
  //     let eventsArr = [];

  //     if (err) {
  //       return res.status(500).send({message: err.message});
  //     }
  //     if (rsvps) {
  //       Event.find(
  //         {_id: {$in: _eventIdsArr}, startDatetime: { $gte: new Date() }},
  //         _rsvpEventsProjection, (err, events) => {
  //         if (err) {
  //           return res.status(500).send({message: err.message});
  //         }
  //         if (events) {
  //           events.forEach(event => {
  //             eventsArr.push(event);
  //           });
  //         }
  //         res.send(eventsArr);
  //       });
  //     }
  //   });
  // });

  // // POST a new event
  // app.post('/api/event/new', jwtCheck, adminCheck, (req, res) => {
  //   Event.findOne({
  //     title: req.body.title,
  //     location: req.body.location,
  //     startDatetime: req.body.startDatetime}, (err, existingEvent) => {
  //     if (err) {
  //       return res.status(500).send({message: err.message});
  //     }
  //     if (existingEvent) {
  //       return res.status(409).send({message: 'You have already created an event with this title, location, and start date/time.'});
  //     }
  //     const event = new Event({
  //       title: req.body.title,
  //       location: req.body.location,
  //       startDatetime: req.body.startDatetime,
  //       endDatetime: req.body.endDatetime,
  //       description: req.body.description,
  //       viewPublic: req.body.viewPublic
  //     });
  //     event.save((err) => {
  //       if (err) {
  //         return res.status(500).send({message: err.message});
  //       }
  //       res.send(event);
  //     });
  //   });
  // });

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

  // // PUT (edit) an existing event
  // app.put('/api/event/:id', jwtCheck, adminCheck, (req, res) => {
  //   Event.findById(req.params.id, (err, event) => {
  //     if (err) {
  //       return res.status(500).send({message: err.message});
  //     }
  //     if (!event) {
  //       return res.status(400).send({message: 'Event not found.'});
  //     }
  //     event.title = req.body.title;
  //     event.location = req.body.location;
  //     event.startDatetime = req.body.startDatetime;
  //     event.endDatetime = req.body.endDatetime;
  //     event.viewPublic = req.body.viewPublic;
  //     event.description = req.body.description;

  //     event.save(err => {
  //       if (err) {
  //         return res.status(500).send({message: err.message});
  //       }
  //       res.send(event);
  //     });
  //   });
  // });

  // // DELETE an event and all associated RSVPs
  // app.delete('/api/event/:id', jwtCheck, adminCheck, (req, res) => {
  //   Event.findById(req.params.id, (err, event) => {
  //     if (err) {
  //       return res.status(500).send({message: err.message});
  //     }
  //     if (!event) {
  //       return res.status(400).send({message: 'Event not found.'});
  //     }
  //     Rsvp.find({eventId: req.params.id}, (err, rsvps) => {
  //       if (rsvps) {
  //         rsvps.forEach(rsvp => {
  //           rsvp.remove();
  //         });
  //       }
  //       event.remove(err => {
  //         if (err) {
  //           return res.status(500).send({message: err.message});
  //         }
  //         res.status(200).send({message: 'Event and RSVPs successfully deleted.'});
  //       });
  //     });
  //   });
  // });

  // // POST a new RSVP
  // app.post('/api/rsvp/new', jwtCheck, (req, res) => {
  //   Rsvp.findOne({eventId: req.body.eventId, userId: req.body.userId}, (err, existingRsvp) => {
  //     if (err) {
  //       return res.status(500).send({message: err.message});
  //     }
  //     if (existingRsvp) {
  //       return res.status(409).send({message: 'You have already RSVPed to this event.'});
  //     }
  //     const rsvp = new Rsvp({
  //       userId: req.body.userId,
  //       name: req.body.name,
  //       eventId: req.body.eventId,
  //       attending: req.body.attending,
  //       guests: req.body.guests,
  //       comments: req.body.comments
  //     });
  //     rsvp.save((err) => {
  //       if (err) {
  //         return res.status(500).send({message: err.message});
  //       }
  //       res.send(rsvp);
  //     });
  //   });
  // });

  // // PUT (edit) an existing RSVP
  // app.put('/api/rsvp/:id', jwtCheck, (req, res) => {
  //   Rsvp.findById(req.params.id, (err, rsvp) => {
  //     if (err) {
  //       return res.status(500).send({message: err.message});
  //     }
  //     if (!rsvp) {
  //       return res.status(400).send({message: 'RSVP not found.'});
  //     }
  //     if (rsvp.userId !== req.user.sub) {
  //       return res.status(401).send({message: 'You cannot edit someone else\'s RSVP.'});
  //     }
  //     rsvp.name = req.body.name;
  //     rsvp.attending = req.body.attending;
  //     rsvp.guests = req.body.guests;
  //     rsvp.comments = req.body.comments;

  //     rsvp.save(err => {
  //       if (err) {
  //         return res.status(500).send({message: err.message});
  //       }
  //       res.send(rsvp);
  //     });
  //   });
  // });

};
