/*
Collector main service.
Run:

node app.js

to start listening to traces. Change the appropriate settings in 'config.js'.

 */

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

module.exports = collector;