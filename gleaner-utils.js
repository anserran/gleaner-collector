module.exports.copyProperties = function( src, dst ){
	for ( var key in src ){
		dst[key] = src[key];
	}
};

module.exports.serverTimestamp = function( req, traces, cb ){
	for (var i = traces.length - 1; i >= 0; i--) {
		if (traces[i].timeStamp){
			traces[i].timeStamp = new Date(traces[i].timeStamp);
		}
		else {
			traces[i].timeStamp = new Date();
		}
	}
	cb(null);
};