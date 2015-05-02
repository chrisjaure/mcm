import http from 'http';
import finalhandler from 'finalhandler';
import debug from 'debug';
import routes from './routes';

let debugServer = debug('mcm:server');
let server = http.createServer((req, res) => {
	routes(req, res, finalhandler(req, res));
});
server.listen(process.argv[2] || 8000, '127.0.0.1', () => {
	debugServer("server listening on %j", server.address());
});

export default server;