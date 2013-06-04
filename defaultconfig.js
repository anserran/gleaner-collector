/*
Collector configuration
*/
module.exports = {
	// authenticator: require('./authenticators/eadauthenticator.js').eadauthenticator,
	authenticator: require('./authenticators/eadauthenticator.js').ipauthenticator,
	// Database authorization
	mongoose_auth: 'mongodb://localhost:27017/gleaner-collector',
	// Salt for sessions generation
	sessionSalt: 'your-salt-here',

	mysql: {
		host: 'localhost',
		user: 'root',
		password: 'pass',
		database: 'gleaner_collector_frontend'
	},

	compact: true
};
