module.exports = function(experience){

	var Experience = experience;

	function validate( req, callback ){
		if ( req.param('name') && req.param('name').length > 0 ){
			if ( req.param('experiencekey') ){
				Experience.find({experiencekey: req.param('experiencekey')}, function( err, experience ){
					if ( experience.length > 0 ){
						callback('experience-token');
					}
					else {
						var newExperience = new Experience({
							gameRef : req.query.id,
							name: req.param('name'),
							experiencekey: req.param('experiencekey'),
							tracking: ( req.param('tracking') === "on" ? true : false )
						});
						newExperience.save( function( err, ex ){
							if ( err ){
								callback('unknown-error');
							}
							else {
								callback(null, ex);
							}
						});
					}
				});
			}
			else {
				callback('experiencekey-token');
			}
		}
		else {
			callback('name-token');
		}
	}

	return {
		validate: validate
	};

};