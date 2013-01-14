/*
This authenticator is done in some experiments with the e-Adventure platform.
Basically, accepts any authorization (other than null and undefined) and
returns it as user id.
*/
var HttpError = require('restify').HttpError;

module.exports.eadauthenticator = (function( ){
	return {
		authenticate: function( authorization, cb ){
			if ( authorization ){
				cb( null, authorization );
			}
			else {
				cb(new HttpError(401));
			}
		}
	};
})();