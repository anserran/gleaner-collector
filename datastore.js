var dataStore = (function( ){

	var mongoose = require('mongoose');
	var config = require('./config').config;
	var async = require('async');
	var SHA1 = new (require('jshashes').SHA1)();

	var copyProperties = require('./gleaner-utils').copyProperties;

	mongoose.connect(config.mongoose_auth);

	var Schema = mongoose.Schema;

	var InputTraceSchema = new Schema({
		userId: { type: String },
		sessionId: { type: Number },
		experiencekey: { type: String },
		type : { type: String, required: true },
		timeStamp : { type: Date, required: true },
		device: { type: String },
		action: { type: String },
		data: { type: {} },
		target: String
	});

	var LogicTraceSchema = new Schema({
		userId: { type: String },
		sessionId: { type: Number },
		experiencekey: { type: String },
		type : { type: String, required: true },
		timeStamp : { type: Date, required: true },
		event: { type: String },
		data: { type: {} },
		target: String
	});

	var ExperienceScheme = new Schema({
		gameRef: { type: String },
		name: { type: String },
		experiencekey: { type: String, index: { unique: true, dropDups: true }},
		tracking: { type: Boolean }
	});

	var SessionSchema = new Schema({
		sessionKey: { type: String, required: true},
		experiencekey: { type: String, required: true },
		userId: { type: String, required: true },
		sessionId: { type: Number, required: true },
		lastUpdate: { type: Date, required: true }
	});

	mongoose.model('InputTrace', InputTraceSchema);
	mongoose.model('LogicTrace', LogicTraceSchema);
	mongoose.model('Experience', ExperienceScheme);
	mongoose.model('Session', SessionSchema);

	var InputTrace = mongoose.model('InputTrace');
	var LogicTrace = mongoose.model('LogicTrace');
	var Experience = mongoose.model('Experience');
	var Session = mongoose.model('Session');

	var ev = require('./validators/experienceValidator.js')(Experience);

	/**
	 * Start session
	 * @param  {String}   userId  user unique identifier
	 * @param  {String}   experiencekey key for the experience to be tracked in this session
	 * @param  {Function} cb      callback with an error and a session key
	 */
	var startSession = function( userId, experiencekey, cb ){
		Experience.where('experiencekey', experiencekey).findOne( function(err, experience){
			if ( err ){
				cb(400);
			}
			else {
				if (experience && experience.experiencekey ){
					Session.find( { 'userId' : userId, 'experiencekey' : experience.experiencekey }, function( err, sessions ){
						if ( err ){
							cb(500);
							console.log('error', err);
						}
						else {
							var maxSession = 0;
							for (var i = sessions.length - 1; i >= 0; i--) {
								maxSession = sessions[i].sessionId > maxSession ? sessions[i].sessionId : maxSession;
							}
							var session = new Session();
							session.experiencekey = experience.experiencekey;
							session.userId = userId;
							session.sessionId = maxSession + 1;
							session.lastUpdate = new Date();
							session.sessionKey = SHA1.b64(session.experiencekey + ':' + session.userId + ':' + session.sessionId + ":" + config.sessionSalt );
							session.save( function( err, s ){
								if (err) {
									cb(500);
									console.log('error', err);
								}
								else {
									cb( null, s.sessionKey);
								}
							});
						}

					});
				}
				else {
					cb(400);
				}
			}
		});
	};

	var getSessions = function( lastMinutes, experiencekey, callback ){
		var minimumDate = new Date(new Date().getTime() - lastMinutes * 60000);
		Session.find({ experiencekey: experiencekey, lastUpdate: {$gt: minimumDate}},
			function(err, sessions ){
				callback( err, sessions );
			});
	};

	var addTraces = function( traces, cb ){
		var logicTraces = [];
		var inputTraces = [];
		for (var i = 0; i < traces.length; i++) {
			var trace = null;
			switch(traces[i].type){
				case 'logic':
				logicTraces.push(traces[i]);
				break;
				case 'input':
				inputTraces.push(traces[i]);
				break;
				default:
				// FIXME add it to some other table??
				break;
			}
		}

		async.series([
			function( callback ){
				if ( logicTraces.length > 0 ){
					LogicTrace.create(logicTraces, function( err ){
						if (err){
							callback(err);
						}
						else {
							callback(null);
						}
					});
				}
				else {
					callback( null );
				}
			},

			function( callback ){
				if (inputTraces.length > 0){
					InputTrace.create(inputTraces, function( err ){
						if (err){
							callback(err);
						}
						else {
							callback(null);
						}
					});
				}
				else {
					callback(null);
				}
			}
			],
			function( err ){
				if (err){
					cb(500);
					console.log('error', err);
				}
				else{
					cb(null);
				}
			});
	};

	/**
	 * Filter to add session info to traces
	 * @param {Object}   req    request
	 * @param {Array}   traces traces
	 * @param {Function} cb     callback function
	 */
	var addSessionInfo = function(req, traces, cb){
		Session.where('sessionKey', req.headers.authorization).findOne(function( err, session){
			if ( err || !session ){
				if ( err ){
					console.log(err);
				}
				else {
					console.log('Session with id ' + req.headers.authorization + ' not found' );
				}
				cb(401);
			}
			else {
				for (var i = traces.length - 1; i >= 0; i--) {
					traces[i].experiencekey = session.experiencekey;
					traces[i].sessionId = session.sessionId;
					traces[i].userId = session.userId;
				}
				cb( null );
			}
		});
	};

	var checkSessionKey = function( sessionKey, cb ){
		Session.where('sessionKey', sessionKey).findOne(function( err, session){
			if ( session ){
				session.lastUpdate = new Date();
				session.save();
				cb(true);
			}
			else
				cb(false);
		});
	};

	var addExperience = function( req, res ){
		ev.validate( req, function( err, experience ){
			if ( err ){
				res.send(400, err);
			}
			else {
				res.send(200, experience);
			}
		});
	};

	var getExperiences = function( gameId, callback ){
		Experience.find({ gameRef: gameId },
			function( err, experiences ){
				callback(err, experiences || {});
			}
		);
	};

	var getExperience = function( experiencekey, callback ){
		Experience.findOne({experiencekey: experiencekey}, function( err, experience ){
			callback(err, experience);
		});
	};

	return {
		addTraces: addTraces,
		startSession: startSession,
		addSessionInfo: addSessionInfo,
		checkSessionKey: checkSessionKey,
		addExperience: addExperience,
		getExperiences: getExperiences,
		getExperience: getExperience,
		getSessions: getSessions
	};

})();

module.exports = dataStore;