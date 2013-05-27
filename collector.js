/**
* Service to collect traces
* @param {Object} authenticator requests authenticator
* @param {Object} dataStore access to database
* @param {Array} filters a list with filters to apply to every trace received
*/
var Collector = function( configuration, dataStore, filterList ){
	var async = require('async');
	var authenticator = configuration.authenticator;
	var filters = filtersList;

	function addFilter( filter ){
		filters.push(filter);
	}

	// Start tracking request
	function start(req, res){
		var sessionkey = req.url.substr(req.url.lastIndexOf('/') + 1);
		// Authorization header must contain a valid authorization
		if ( req.headers.authorization ){
			authenticator.authenticate( req, function( err, userId ){
				if ( err ){
					res.status(401);
					res.end();
				}
				else {
					dataStore.startSession( req, userId, sessionkey, function( err, usersessionkey ){
						if (err){
							res.send(err);
						}
						else {
							console.log('Start tracking ' + req.headers.authorization );
							res.status(200);
							res.send({ sessionKey: usersessionkey });
						}
					});
				}
			});
		}
		else {
			res.send(401);
		}
	}

	// Receive traces
	function track(req, res){
		dataStore.checkSessionKey( req.headers.authorization, function( authorized ){
			if (!authorized){
				res.send(401);
				return;
			}

			if ( req.body ){
				var filtersApply = [];
				// Apply filters to traces. Filters transfrom req.body
				for (var i = 0; i < filters.length; i++) {
					filtersApply.push(async.apply(filters[i], req, req.body ));
				}

				async.series( filtersApply, function( err, results ){
					if ( err ){
						res.send(err);
					}
					else {
						console.log(req.body.length + ' traces added');
						// When filters are done, we add the traces
						dataStore.addTraces( req, req.body, function( err ){
							if ( err ){
								res.send(err);
							}
							else {
								res.send(204);
							}
						});
				}
			});
			}
			else {
				res.send(400);
			}
		} );
	}

	return {
		start: start,
		track: track,
		addFilter: addFilter
	};
};

module.exports = Collector;