/**
* Service to collect traces
* @param {Object} authenticator requests authenticator
* @param {Object} dataStore access to database
* @param {Array} filters a list with filters to apply to every trace received
*/
var Collector = function( authenticator, dataStore, filters ){

	var log = require('winston');
	var async = require('async');
	var restify = require('restify');
	var server = restify.createServer();
	var config = require('./config');

	server.use(restify.queryParser());
	server.use(restify.bodyParser());

	// Start tracking request.
	server.get(config.apiroot + 'start/:gamekey', function(req, res, next){
		// Authorization header must contain a valid authorization
		if ( req.headers.authorization ){
			authenticator.authenticate( req.headers.authorization, function( err, userId ){
				if ( err ){
					res.send(err);
				}
				else {
					dataStore.startSession( userId, req.params.gamekey, function( err, sessionKey ){
						if (err){
							res.send(err);
						}
						else {
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
	});

	// Receive traces
	server.post(config.apiroot + 'track', function(req, res, next){
		if ( req.params ){
			var filtersApply = [];
			// Apply filters to traces. Filters transfrom req.params
			for (var i = 0; i < filters.length; i++) {
				filtersApply.push(async.apply(filters[i], req, req.params ));
			}

			async.series( filtersApply, function( err, results ){
				if ( err ){
					res.send(err);
				}
				else {
					log.log('debug', req.params.length + ' traces added');
					// When filters are done, we add the traces
					dataStore.addTraces( req.params, function( err ){
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
	});

	var listen = function( port, fn ){
		server.listen( port, fn );
	};

	var url = function( ){
		return server.url;
	};

	return {
		listen: listen,
		url: url
	};
};

module.exports.Collector = Collector;