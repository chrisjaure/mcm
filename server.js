var http = require('http');
var Router = require('router');
var finalhandler = require('finalhandler');
var debugServer = require('debug')('mcm:server');
var mcm = require('./index')();
var routes = Router();
var server;

function template (running) {
	var html = '<html><head><title>Minecraft Server Status</title><body>';
	if (running) {
		html += 'Server is running!';
	}
	else {
		html += 'Server is not running. <a href="/start">Start it.</a>';
	}
	html += '</body></html>';
	return html;
}

routes.get('/', function(req, res) {
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	mcm.getStatus(function(err, stat) {
		if (err) {
			debugServer(err);
		}
		res.end(template(!err));
	});
});

routes.get('/start', function(req, res) {
	mcm.getStatus(function(err, stat) {
		if (!err) {
			return res.end('Already started!');
		}
		mcm.start(function(err) {
			if (err) {
				debugServer(err);
				return res.end('Cannot start server!');
			}
			res.end('Server started!');
		});
	});
});

routes.get('/stop', function(req, res) {
	mcm.getStatus(function(err, stat) {
		if (err) {
			return res.end('Already stopped!');
		}
		if (stat.num_players === 0) {
			mcm.stop(function(err) {
				if (err) {
					debugServer(err);
					return res.end('Cannot stop server!');
				}
				res.end('Server stopped!');
			});
		}
		else {
			res.end('There are %s players still connected!', stat.num_players);
		}
	});
});

var server = http.createServer(function(req, res) {
	routes(req, res, finalhandler(req, res));
});
server.listen(process.argv[2] || 8000, '127.0.0.1', function() {
	debugServer("server listening on %j", server.address());
});