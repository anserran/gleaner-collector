var GleanerCollector = function( externalConfiguration ){
	var async = require('async');

	var configuration = require('./defaultconfig.js');
	// Override default configuration
	if ( externalConfiguration ){
		for ( var att in externalConfiguration ){
			configuration[att] = externalConfiguration[att];
		}
	}

	var dataStore = configuration.usemysql ? new require('./datastore-mysql.js')(configuration) : new require('./datastore.js')(configuration);
	var filters = [];

	var addFilter = function( filter ){
		filters.push(filter);
	};

	// Start tracking request
	var start = function(req, res){
		var sessionkey = req.url.substr(req.url.lastIndexOf('/') + 1);
		dataStore.startSession( req, sessionkey, function( err, usersessionkey ){
			if (err){
				res.send(401);
			}
			else {
				if ( usersessionkey ){
					res.status(200);
					res.send({ sessionKey: usersessionkey });
				}
				else {
					res.send(401);
				}
			}
		});
	};

	// Receive traces
	var track = function(req, res){
		dataStore.checkSessionKey( req.headers.authorization, function( err, usersessionId ){
			if (err || !usersessionId){
				res.send(401);
				return;
			}

			// Check that body is at least has length
			if ( req.body && req.body.length > 0 ){
				if ( filters.length > 0 ){
					var filtersApply = [];
					// Apply filters to traces. Filters transfrom req.body
					for (var i = 0; i < filters.length; i++) {
						filtersApply.push(async.apply(filters[i], req, req.body ));
					}

					async.series( filtersApply, function( err, results ){
						if ( err ){
							res.send(400);
						}
						else {
							// When filters are done, we add the traces
							dataStore.addTraces( req, req.body, function( err ){
								res.send( err ? 400 : 204 );
							});
						}
					});
				} else {
					dataStore.addTraces( req, req.body, usersessionId, function( err ){
						res.send( err ? 400 : 204 );
					});
				}
			}
			else {
				res.send(204);
			}
		} );
	};

	var countTraces = function( usersessionId, cb ){
		dataStore.countTraces( usersessionId, cb );
	};

	var removeTraces = function( usersessionId, cb ){
		dataStore.removeTraces( usersessionId, cb);
	};

	return {
		start: start,
		track: track,
		addFilter: addFilter,
		countTraces: countTraces,
		removeTraces: removeTraces
	};
};

module.exports = GleanerCollector;