var dataStore = require('./datastore.js');
var authenticator = require('./authenticator.js')(dataStore);
var collector = require('./collector.js').Collector(authenticator,dataStore, [require('./gleaner-utils.js').serverTimestamp, authenticator.addSessionInfo]);

collector.listen( 5123, function( ){
	console.log('gleaner-collector listening in ' + collector.url() );
});