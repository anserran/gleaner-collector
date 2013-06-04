/*
Collector configuration
*/
module.exports = {
	// authenticator: require('./authenticators/eadauthenticator.js').eadauthenticator,
	authenticator: require('./authenticators/eadauthenticator.js').ipauthenticator,
	// Salt for sessions generation
	sessionSalt: 'your-salt-here',

	mongodb : {
		host: 'localhost',
		port: 27017,
		database: 'gleaner-collector'
	},
	// If compact is set to true, all traces will be stored as JSON strings in a MySQL database
	compact: true,
	mysql: {
		host: 'localhost',
		user: 'root',
		password: 'pass',
		database: 'gleaner_collector_frontend'
	}
};
