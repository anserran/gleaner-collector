var DataStore = function( config ){
	var MongoClient = require('mongodb').MongoClient,
		Server = require('mongodb').Server;
	var async = require('async');
	var SHA1 = new (require('jshashes').SHA1)();
	var copyProperties = require('./gleaner-utils').copyProperties;

	var db;
	var mongoClient = new MongoClient( new Server(config.mongodb.host, config.mongodb.port));
	mongoClient.open( function( err, mongoClient ){
		db = mongoClient.db(config.mongodb.database);
	});

	/*
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
	*/

	var InputTrace = db.collection('InputTrace');
	var LogicTrace = db.collection('LogicTrace');
	var Session = db.collection('Session');
	var UserSession = db.collection('UserSession');

	/**
	 * Start session
	 * @param  {Object}   req     Original request
	 * @param  {String}   userId  user unique identifier
	 * @param  {String}   sessionkey key for the session to be tracked
	 * @param  {Function} cb      callback with an error and a session key
	 */
	var startSession = function( req, userId, sessionkey, cb ){
		Session.findOne({'sessionkey': sessionkey}, function( err, session ){
			if ( err ){
				cb(400);
			}
			else if (session && session.sessionkey && session.enabled ){
				var userSession = {};
				userSession.session = session._id;
				userSession.userId = userId;
				userSession.usersessionkey = SHA1.b64(new Date().toString() + ':' + userId + ":" + config.sessionSalt );
				userSession.ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
				userSession.firstUpdate = new Date();
				userSession.lastUpdate = new Date();
				UserSession.insert(userSession, function( err, s ){
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
			delete(traces[i].type);
		}

		async.series([
			function( callback ){
				if ( logicTraces.length > 0 ){
					LogicTrace.insert(logicTraces, function( err ){
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
					InputTrace.insert(inputTraces, function( err ){
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
		UserSession.findOne({'usersessionkey': userSessionKey}, function( err, session ){
			if ( session ){
				UserSession.update({_id: session._id}, {$set: { lastUpdate: new Date()}});
				cb(true);
			}
			else
				cb(false);
		});
	};

	var countTraces = function( usersessionkey, cb ){
		LogicTrace.count({usersessionkey: usersessionkey}, function( err, count ){
			if ( err ){
				cb(err);
			}
			else {
				InputTrace.count( {usersessionkey: usersessionkey}, function( err, count2 ){
					cb( err, count + count2 );
				});
			}
		});
	};

	return {
		addTraces: addTraces,
		startSession: startSession,
		addSessionInfo: addSessionInfo,
		checkSessionKey: checkSessionKey,
		countTraces: countTraces
	};

};

module.exports = DataStore;