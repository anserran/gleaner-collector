/*
Collector configuration
*/
module.exports.config = {
	// authenticator: require('./authenticators/eadauthenticator.js').eadauthenticator,
	authenticator: require('./authenticators/eadauthenticator.js').ipauthenticator,
	// Api root
	apiroot: '/gleaner/c/',
	// Database authorization
	mongoose_auth: 'mongodb://localhost:27017/gleaner-collector',
	// Salt for sessions generation
	sessionSalt: 'your-salt-here',
	// Port where collector must listen
	port: 5123
};
