
/**
 * Filter to add to the traces the server timestamp
 * @param  {Object}   req    The original request
 * @param  {Array}    traces The list of traces
 * @param  {Function} cb     Callback function, taking an error
 */
var serverTimestamp = function( req, traces, cb ){
	for (var i = traces.length - 1; i >= 0; i--) {
		traces[i].timeStamp = new Date();
	}
	cb(null);
};

module.exports.serverTimestamp = serverTimestamp;