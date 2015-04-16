var http = require('http');
var finalhandler = require('finalhandler');
var debugServer = require('debug')('mcm:server');
var routes = require('./routes');

var server = http.createServer(function(req, res) {
	routes(req, res, finalhandler(req, res));
});
server.listen(process.argv[2] || 8000, '127.0.0.1', function() {
	debugServer("server listening on %j", server.address());
});

module.exports = server;