var dataStore = (function( ){
	var mongoose = require('mongoose');
	var config = require('./config');
	var async = require('async');
	var SHA1 = new require('jshashes').SHA1();
	var HttpError = require('restify').HttpError;

	var copyProperties = require('./gleaner-utils').copyProperties;

	mongoose.connect(config.creds.mongoose_auth);

	var Schema = mongoose.Schema;

	var InputTraceSchema = new Schema({
		userId: { type: String },
		sessionId: { type: Number },
		gameId: { type: String },
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
		gameId: { type: String },
		type : { type: String, required: true },
		timeStamp : { type: Date, required: true },
		event: { type: String },
		data: { type: {} }
	});

	var GameSchema = new Schema({
		gameId: { type: Number },
		title: { type: String },
		gamekey: { type: String}
	});

	var SessionSchema = new Schema({
		sessionKey: { type: String, required: true},
		gameId: { type: Number, required: true },
		userId: { type: Number, required: true },
		sessionId: { type: Number, required: true }
	});

	mongoose.model('InputTrace', InputTraceSchema);
	mongoose.model('LogicTrace', LogicTraceSchema);
	mongoose.model('Game', GameSchema);
	mongoose.model('Session', SessionSchema);

	var InputTrace = mongoose.model('InputTrace');
	var LogicTrace = mongoose.model('LogicTrace');
	var Game = mongoose.model('Game');
	var Session = mongoose.model('Session');

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
					cb(err);
				}
				else{
					cb(null);
				}
			});
	};

	var checkCredentials = function( credentials, cb ){
		cb(credentials);
	};

	var startSession = function( userId, gamekey, cb ){
		Game.where('gamekey', gamekey).findOne( function(err, game){
			if ( err ){
				cb(err);
			}
			else {
				if (game && game.id){
					Session.
					where('userId', userId).
					where('gameId', game.gameId).
					findOne( function( err, session ){
						if ( err ){
							cb(err, null);
						}
						else {
							if ( session ){
								session.sessionId++;
							}
							else {
								session = new Session();
								session.gameId = game.gameId;
								session.userId = userId;
								session.sessionId = 0;
							}
						// FIXME salt here
						session.sessionKey = SHA1.b64(session.gameId + ':' + session.userId + ':' + session.sessionId);
						session.save( function( err, s ){
							if ( err ){
								cb( err, null );
							}
							else{
								cb( null, s.sessionKey);
							}
						});
					}

				});
				}
				else {
					cb( new HttpError(400, 'Game key not found'), null);
				}
			}
		});
	};

	var getSessionInfo = function( sessionKey, cb ){
		Session.where('sessionKey', sessionKey).findOne( function( err, session ){
			if ( err || !session ){
				cb( null, null, null );
			}
			else {
				cb(session.gameId, session.userId, session.sessionId );
			}
		});

	};

	// Gets
	var get = function(collection, params, cb ){
		mongoose.model(collection).find( cb );
	};

	return {
		addTraces: addTraces,
		checkCredentials: checkCredentials,
		startSession: startSession,
		getSessionInfo: getSessionInfo,
		get: get
	};

})();

module.exports = dataStore;