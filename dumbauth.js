var fail = true;

var generateSessionApiKey = function( gamekey, cb ){
	cb( null, '189A$%&YEJ' );
};

var dumbAuth = function(credentials, cb){
	console.log("Authenticating...");
	if ( fail ){
		cb(new Error('Invalid authkey'));
	}
	else {
		cb( null );
	}
};

var addSessionInfo = function( req, traces, cb ){
	for (var i = traces.length - 1; i >= 0; i--) {
		traces[i].gameId = 1;
		traces[i].sessionId = 2;
		traces[i].userId = 3;
	}
	cb( null );
};

module.exports.dumbauth = {
	checkCredentials: dumbAuth,
	generateSessionApiKey: generateSessionApiKey,
	addSessionInfo: addSessionInfo
};