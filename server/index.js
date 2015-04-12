var http = require('http');
var fs = require('fs');
var Router = require('router');
var finalhandler = require('finalhandler');
var debugServer = require('debug')('mcm:server');
var mcm = require('../index')();
var routes = Router();
var server;

function respondJson (res, object, code) {
	res.writeHead(code || 200, {"Content-Type": "application/json"});
	res.end(JSON.stringify(object));
}

routes.get('/', function(req, res) {
	fs.createReadStream(__dirname + '/../client/index.html').pipe(res);
});
routes.get('/build.js', function(req, res) {
	fs.createReadStream(__dirname + '/../client/build.js').pipe(res);
});

routes.get('/status', function(req, res) {
	mcm.getStatus(function(err, stat) {
		if (err) {
			return respondJson(res, { status: 0 });
		}
		stat.status = 1;
		respondJson(res, stat);
	});
});

routes.post('/start', function(req, res) {
	mcm.getStatus(function(err, stat) {
		if (!err) {
			return respondJson(res, { error: 'Already started!' }, 403);
		}
		mcm.start(function(err) {
			if (err) {
				debugServer(err);
				return respondJson(res, { error: 'Cannot start server!' }, 500);
			}
			respondJson(res, { success: 'Server started!' });
		});
	});
});

routes.post('/stop', function(req, res) {
	mcm.getStatus(function(err, stat) {
		if (err) {
			return respondJson(res, { error: 'Already stopped!' }, 403);
		}
		if (stat.num_players === 0) {
			mcm.stop(function(err) {
				if (err) {
					debugServer(err);
					return respondJson(res, { error: 'Cannot stop server!' }, 500);
				}
				respondJson(res, { success: 'Server stopped!' });
			});
		}
		else {
			respondJson(res, { error: 'There are '+stat.num_players+' players still connected!' }, 403);
		}
	});
});

var server = http.createServer(function(req, res) {
	routes(req, res, finalhandler(req, res));
});
server.listen(process.argv[2] || 8000, '127.0.0.1', function() {
	debugServer("server listening on %j", server.address());
});