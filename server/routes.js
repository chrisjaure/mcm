var fs = require('fs');
var Readable = require('stream').Readable;
var Router = require('router');
var CombinedStream = require('combined-stream');
var debugServer = require('debug')('mcm:server');
var mcm = require('../index')();
var routes = Router();

function respondJson (res, object, code) {
	res.writeHead(code || 200, {"Content-Type": "application/json"});
	res.end(JSON.stringify(object));
}

module.exports = routes;

routes.get('/', function(req, res) {
	var index = CombinedStream.create();
	var script;
	index.append(fs.createReadStream(__dirname + '/../client/index.html'));
	if (process.env.NODE_ENV !== 'production') {
		// add browser-sync for reloading css
		script = new Readable();
		script.push('<script id="__bs_script__">document.write("<script async src=\'http://HOST:3000/browser-sync/browser-sync-client.2.6.4.js\'><\\/script>".replace("HOST", location.hostname));</script>');
		script.push(null);
		index.append(script);
	}
	index.pipe(res);
});
routes.get('/build.js', function(req, res) {
	fs.createReadStream(__dirname + '/../client/build.js').pipe(res);
});
routes.get('/build.css', function(req, res) {
	fs.createReadStream(__dirname + '/../client/build.css').pipe(res);
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