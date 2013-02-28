/**
* Service to collect traces
* @param {Object} authenticator requests authenticator
* @param {Object} dataStore access to database
* @param {Array} filters a list with filters to apply to every trace received
*/
var Collector = function( authenticator, dataStore, filters ){

	var async = require('async');
	var config = require('./config').config;

	// Start tracking request.
	function start(req, res){
		var experiencekey = req.url.substr(req.url.lastIndexOf('/') + 1);
		// Authorization header must contain a valid authorization
		if ( req.headers.authorization ){
			authenticator.authenticate( req, function( err, userId ){
				if ( err ){
					res.status(404);
					res.end();
				}
				else {
					dataStore.startSession( userId, experiencekey, function( err, sessionKey ){
						if (err){
							res.send(err);
						}
						else {
							console.log('Start tracking ' + req.headers.authorization );
							res.status(200);
							res.send({ sessionKey: sessionKey });
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
						console.log('debug', req.body.length + ' traces added');
					// When filters are done, we add the traces
					dataStore.addTraces( req.body, function( err ){
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
		track: track
	};
};

module.exports.Collector = Collector;