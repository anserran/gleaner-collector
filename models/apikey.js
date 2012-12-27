var ApiKeySchema = new Schema({
	userId: { type: String },
	api: { type: String }
});

var SessionKeySchema = new Schema({
	userId: { type: String },
	gameId: { type: String },
	sessionId: { type: Number },
	authtoken: { type: String }
});

ApiKeySchema.statics.startSession = function( gamekey, apikey, cb ){
	if ( gamekey && apikey ){
		mongoose.models.ApiKey
			.where('apkikey', apikey)
				.findOne( function( err, obj ){
					if ( err ){
						cb( err );
					}
					else {

					}
				});
	}
};

mongoose.model('ApiKey', ApiKeySchema);
mongoose.model('SessionKey', SessionKeySchema);