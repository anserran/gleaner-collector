/**
* Service to collect traces
* @param {Object} authenticator
* @param {Object} dataStore
* @param {Array} filters
*/
var Collector = function( authenticator, dataStore, filters ){
	
	var async = require('async');
	var restify = require('restify');
	var server = restify.createServer();

	server.use(restify.queryParser());
	server.use(restify.bodyParser());

	server.get('/start/:gamekey', function(req, res, next){
		if ( req.headers.authorization ){
			authenticator.generateSessionApiKey( req.headers.authorization, req.params.gamekey, function( err, sessionApiKey ){
				if (err){
					res.status(400);
					res.send('Game key not found');
				}
				else {
					res.status(200);
					res.send({ sessionKey: sessionApiKey });
				}
			});
		}
		else {
			res.status(400);
			res.end();
		}
	});

	server.post('/track', function(req, res, next){
		if ( req.params ){
			try {
				var filtersApply = [];
				// Apply filters to traces
				for (var i = 0; i < filters.length; i++) {
					filtersApply.push(async.apply(filters[i], req, req.params ));
				}

				async.series( filtersApply, function( err, results ){
					if ( err ){
						res.send(err);
					}
					else {
						dataStore.addTraces( req.params, function( err ){
							if ( err ){
								res.status(400);
							}
							else {
								res.status(200);
							}
							res.end();
						});
					}
				});
			} catch ( err ){
				res.status(400);
				res.end();
			}
		}
		else {
			res.status(400);
			res.end();
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