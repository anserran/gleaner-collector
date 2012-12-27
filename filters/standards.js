module.exports.serverTimestamp = function( req, traces, cb ){
	for (var i = traces.length - 1; i >= 0; i--) {
		traces[i].timeStamp = new Date();
	}
	cb(null);
};