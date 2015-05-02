import fs from 'fs';
import { Readable } from 'stream';
import Router from 'router';
import debug from 'debug';
import mime from 'mime-types';
import CombinedStream from 'combined-stream';
import replaceStream from 'replacestream';
import Mcm from '../index';
import React from 'react';
import App from '../client/component/app';

const routes = Router();
const debugServer = debug('mcm:server');
const mcm = Mcm();

function respondJson (res, object, code) {
	res.writeHead(code || 200, {"Content-Type": mime.contentType('json')});
	res.end(JSON.stringify(object));
}

export default routes;

routes.get('/', (req, res) => {
	let index = CombinedStream.create();
	let reactHtml = React.renderToString(React.createFactory(App)({}));
	let script;
	index.append(fs.createReadStream(__dirname + '/../client/index.html'));
	if (process.env.NODE_ENV !== 'production') {
		// add browser-sync for reloading css
		script = new Readable();
		script.push('<script id="__bs_script__">document.write("<script async src=\'http://HOST:3000/browser-sync/browser-sync-client.2.6.4.js\'><\\/script>".replace("HOST", location.hostname));</script>');
		script.push(null);
		index.append(script);
	}
	res.writeHead(200, {"Content-Type": mime.contentType('html')});
	index
		.pipe(replaceStream('__REACTHTML__', reactHtml))
		.pipe(res);
});
routes.get('/build.js', (req, res) => {
	res.writeHead(200, {"Content-Type": mime.contentType('js')});
	fs.createReadStream(__dirname + '/../client/build.js').pipe(res);
});
routes.get('/build.css', (req, res) => {
	res.writeHead(200, {"Content-Type": mime.contentType('css')});
	fs.createReadStream(__dirname + '/../client/build.css').pipe(res);
});

routes.get('/status', (req, res) => {
	mcm.getStatus((err, stat) => {
		if (err) {
			return respondJson(res, { status: 0 });
		}
		stat.status = 1;
		respondJson(res, stat);
	});
});

routes.post('/start', (req, res) => {
	mcm.getStatus((err, stat) => {
		if (!err) {
			return respondJson(res, { error: 'Already started!' }, 403);
		}
		mcm.start((err) => {
			if (err) {
				debugServer(err);
				return respondJson(res, { error: 'Cannot start server!' }, 500);
			}
			respondJson(res, { success: 'Server started!' });
		});
	});
});

routes.post('/stop', (req, res) => {
	mcm.getStatus((err, stat) => {
		if (err) {
			return respondJson(res, { error: 'Already stopped!' }, 403);
		}
		if (stat.num_players === 0) {
			mcm.stop((err) => {
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