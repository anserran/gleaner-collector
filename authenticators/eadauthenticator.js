/*
This authenticator is done in some experiments with the e-Adventure platform.
Basically, accepts any authorization (other than null and undefined) and
returns it as user id.
*/
var HttpError = require('restify').HttpError;

module.exports.eadauthenticator = (function( ){
	return {
		authenticate: function( req, cb ){
			if ( req.headers.authorization ){
				cb( null, req.headers.authorization );
			}
			else {
				cb(new HttpError(401));
			}
		}
	};
})();

module.exports.ipauthenticator = (function( ){
	return {
		authenticate: function( req, cb ){
			if ( req.headers.authorization && req.headers.authorization !== "anonymus" ){
				cb( null, req.headers.authorization );
			}
			else {
				var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
				if ( ip ){
					cb( null, ip );
				}
				else {
					cb(new HttpError(401));
				}
			}
		}
	};
})();