var restify = require('restify');

var server = restify.createServer();

server.use(function(req, res, next){

	if ( true ){
		res.status(401);
		res.send('¿Dónde vas?');
	}
	console.log('Pasando por function de use');
	res.write('use');
	res.status(200);
	next();
});

server.get('/test', function(req, res, next){
	console.log('Pasando por función de test');
	res.write('Hola');
	res.end();
	next();
});

server.get('/otra', function(req, res, next){
	res.send('Otra');
});

server.listen( 8080, function( ){
	console.log('Listening...');
});