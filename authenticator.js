var authenticator = (function(dataStore){

	var HttpError = require('restify').HttpError;

	var generateSessionApiKey = function(credentials, gamekey, cb){
		dataStore.checkCredentials( credentials, function( userId ){
			dataStore.startSession( userId, gamekey, function(sessionApiKey ){
				if ( sessionApiKey ){
					cb(null, sessionApiKey);
				}
				else {
					cb(new Error("Invalid gamekey"));
				}
			});
		});
	};

	var addSessionInfo = function(req, traces, cb){
		dataStore.getSessionInfo(req.headers.authorization, function(gameId, userId, sessionId){
			if ( gameId ){
				for (var i = traces.length - 1; i >= 0; i--) {
					traces[i].gameId = gameId;
					traces[i].sessionId = userId;
					traces[i].userId = sessionId;
				}
				cb( null );
			}
			else {
				cb( new HttpError(401, "Invalid session key"));
			}
		});
	};

	return {
		generateSessionApiKey: generateSessionApiKey,
		addSessionInfo: addSessionInfo
	};

});

module.exports = authenticator;