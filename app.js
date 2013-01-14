/*
Collector main service.
Run:

node app.js

to start listening to traces. Change the appropriate settings in 'config.js'.

 */

var log = require('winston');
log.add(log.transports.File, {filename: 'gleaner-collector.log', json: false});

// Collector configuration
var config = require('./config').config;

// Data store (MongoDB wrapper)
var dataStore = require('./datastore.js');

// Authentication
var authenticator = config.authenticator;

// Collector
var collector = require('./collector.js').Collector(
	authenticator,
	dataStore,
	// Filters
	[
		require('./gleaner-utils.js').serverTimestamp,
		dataStore.addSessionInfo
	]);

// Start service
collector.listen( config.port, function( ){
	log.log('info', 'gleaner-collector listening in ' + collector.url() );
});