var GameSchema = new Schema({
	gameId: { type: String },
	title: { type: String },
	gamekey: { type: String}
});

GameSchema.statics.getGame = function( gamekey, cb ){
	if ( gamekey ){
		mongoose.models.Game
			.where('gamekey', gamekey)
				.findOne( cb );
	}
};

mongoose.model('Game', GameSchema);