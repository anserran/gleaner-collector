var DatastoreMySQL = function( configuration ){
	var Datastore = require('./datastore.js');
	var datastore = new Datastore(configuration);
	var mysql = require('mysql');
	var pool = mysql.createPool({
		host: configuration.mysql.host,
		user: configuration.mysql.user,
		password: configuration.mysql.password,
		database: configuration.mysql.database
	});

	var startSession = function( req, userId, sessionkey, cb ){
		datastore.startSession(req, userId, sessionkey, cb);
	};

	var addTraces = function( req, traces, cb ){
		var logicTraces = [];
		var inputTraces = [];
		for (var i = 0; i < traces.length; i++) {
			var trace = null;
			switch(traces[i].type){
				case 'logic':
				delete(traces[i].type);
				logicTraces.push({
					usersessionkey: req.headers.authorization,
					json: JSON.stringify(traces[i])
				});
				break;
				case 'input':
				delete(traces[i].type);
				inputTraces.push({
					usersessionkey: req.headers.authorization,
					json: JSON.stringify(traces[i])
				});
				break;
				default:
				// FIXME add it to some other table??
				break;
			}
		}

		pool.getConnection( function( err, conn ){
			if ( err ){
				cb(err);
				return;
			}
			conn.query('INSERT INTO input_traces SET ?', inputTraces, function( err, result ){
				if ( err ){
					conn.end();
					cb(err);
				}
				else {
					conn.query('INSERT INTO logic_traces SET ?', logicTraces, function( err, result ){
						conn.end();
						cb(err);
					});
				}
			});
		});
	};
};

module.exports = DatastoreMySQL;