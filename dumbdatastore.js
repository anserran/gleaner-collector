var traces_collection = [];

function addTraces( traces, cb ){
	console.log("Adding traces");
	for (var i = 0; i < traces.length; i++) {
		traces_collection.push(traces[i]);
		console.log('Trace added:'  + traces[i]);
	}

	cb(null);
}

module.exports.DumbDataStore = { 
	addTraces: addTraces
};