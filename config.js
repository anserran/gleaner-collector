/*
Collector configuration
*/
module.exports.config = {
	authenticator: require('./authenticators/eadauthenticator.js').eadauthenticator,
	// Api root
	apiroot: '/gleaner/c/',
	// Database authorization
	mongoose_auth: 'mongodb://localhost:27017/gleaner_test',
	// Salt for sessions generation
	sessionSalt: 'your-salt-here',
	// Port where collector must listen
	port: 5123
};
