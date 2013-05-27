// Data store (MongoDB wrapper)
var DataStore = require('./datastore.js');
var Collector = require('./collector.js');

var GleanerCollector = function( configuration, filters ){
	// Collector configuration
	var defaultConfiguration = require('./defaultconfig.js');
	if ( configuration ){
		for ( var att in defaultConfiguration ){
			configuration[att] = configuration[att] || defaultConfiguration[att];
		}
	}
	else {
		configuration = defaultConfiguration;
	}
	var dataStore = new DataStore(configuration.authenticator);
	var collector = new Collector(configuration, dataStore,
		[
			require('./gleaner-utils.js').serverTimestamp
		]);

	for (var i = filters.length - 1; i >= 0; i--) {
		collector.addFilter(filters[i]);
	}

};

module.exports = GleanerCollector;