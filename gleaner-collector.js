// Data store (MongoDB wrapper)
var DataStore = require('./datastore.js');
var DataStoreMySQL = require('./datastore-mysql.js');
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
	var dataStore = configuration.compact ? new DataStoreMySQL(configuration) : new DataStore(configuration);
	var collector = new Collector(configuration, dataStore, []);

	for (var i = filters.length - 1; i >= 0; i--) {
		collector.addFilter(filters[i]);
	}

	return collector;

};

module.exports = GleanerCollector;