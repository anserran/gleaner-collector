var Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId,
	Validations = require('./validations.js');

var InputTraceSchema = new Schema({
	userId: { type: String },
	sessionId: { type: Number },
	gameId: { type: String },
	type : { type: String, required: true },
	timeStamp : { type: Date, required: true },
	device: { type: String },
	action: { type: String },
	values: { type: [] },
	target: String
});

var LogicTraceSchema = new Schema({
	userId: { type: String },
	sessionId: { type: Number },
	gameId: { type: String },
	type : { type: String, required: true },
	timeStamp : { type: Date, required: true },
	event: { type: String },
	values: { type: [] }
});

InputTraceSchema.methods.addTrace = function ( trace ){
	var inputTrace = new mongoose.models.InputTrace( );
	for(var key in obj)
        inputTrace[key] = trace[key];
    inputTrace.save();
};

LogicTraceSchema.methods.addTrace = function ( trace ){
	var logicTrace = new mongoose.models.LogicTrace( );
	for(var key in obj)
        logicTrace[key] = trace[key];
    logicTrace.save();
};

mongoose.model('InputTrace', InputTraceSchema);
mongoose.model('LogicTrace', LogicTraceSchema);