var DataStore = function( config ){
	var mongoose = require('mongoose');
	var async = require('async');
	var SHA1 = new (require('jshashes').SHA1)();

	var copyProperties = require('./gleaner-utils').copyProperties;

	mongoose.connect(config.mongoose_auth);

	var Schema = mongoose.Schema,
		ObjectId = Schema.ObjectId;

	var InputTraceSchema = new Schema({
		usersessionkey: { type: String },
		type : { type: String, required: true },
		timeStamp : { type: Date, required: true },
		serverTimeStamp : { type: Date, required: true },
		device: { type: String },
		action: { type: String },
		data: { type: {} },
		target: String
	});

	var LogicTraceSchema = new Schema({
		usersessionkey: { type: String },
		type : { type: String, required: true },
		timeStamp : { type: Date, required: true },
		serverTimeStamp : { type: Date, required: true },
		event: { type: String },
		data: { type: {} },
		target: String
	});

	var SessionScheme = new Schema({
		name: { type: String },
		game: { type: String },
		sessionkey: { type: String },
		enabled: { type: Boolean },
		owner: { type: String }
	});

	var UserSessionSchema = new Schema({
		session: ObjectId,
		userId: { type: String, required: true },
		usersessionkey: { type: String, required: true},
		ip: { type: String, required: true },
		firstUpdate: { type: Date, required: true },
		lastUpdate: { type: Date, required: true }
	});

	mongoose.model('InputTrace', InputTraceSchema);
	mongoose.model('LogicTrace', LogicTraceSchema);
	mongoose.model('Session', SessionScheme);
	mongoose.model('UserSession', UserSessionSchema);

	var InputTrace = mongoose.model('InputTrace');
	var LogicTrace = mongoose.model('LogicTrace');
	var Session = mongoose.model('Session');
	var UserSession = mongoose.model('UserSession');

	/**
	 * Start session
	 * @param  {Object}   req     Original request
	 * @param  {String}   userId  user unique identifier
	 * @param  {String}   sessionkey key for the session to be tracked
	 * @param  {Function} cb      callback with an error and a session key
	 */
	var startSession = function( req, userId, sessionkey, cb ){
		Session.where('sessionkey', sessionkey).findOne( function( err, session ){
			if ( err ){
				cb(400);
			}
			else if (session && session.sessionkey && session.enabled ){
				var userSession = new UserSession();
				userSession.session = session._id;
				userSession.userId = userId;
				userSession.usersessionkey = SHA1.b64(new Date().toString() + ':' + userId + ":" + config.sessionSalt );
				userSession.ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
				userSession.firstUpdate = new Date();
				userSession.lastUpdate = new Date();
				userSession.save( function( err, s ){
						if (err) {
							cb(500);
							console.log('error', err);
						}
						else {
							cb( null, s.usersessionkey );
						}
					});
			}
			else {
				cb(400);
			}
		});
	};

	/**
	 * Add traces to the datastore
	 * @param  {Array}    traces A list of traces
	 * @param  {Function} cb     Calblack taking an error
	 */
	var addTraces = function( req, traces, cb ){
		addSessionInfo(req, traces);
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
			delete(traces[i].type)
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
	 */
	var addSessionInfo = function(req, traces ){
		for (var i = traces.length - 1; i >= 0; i--) {
			traces[i].usersessionkey = req.headers.authorization;
		}
	};

	var checkSessionKey = function( userSessionKey, cb ){
		UserSession.where('usersessionkey', userSessionKey).findOne(function( err, session ){
			if ( session ){
				session.lastUpdate = new Date();
				session.save();
				cb(true);
			}
			else
				cb(false);
		});
	};

	return {
		addTraces: addTraces,
		startSession: startSession,
		addSessionInfo: addSessionInfo,
		checkSessionKey: checkSessionKey
	};

};

module.exports = DataStore;