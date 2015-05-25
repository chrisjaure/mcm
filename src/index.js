import mcping from 'mc-ping';
import google from 'googleapis';
import EventEmitter from 'eventemitter3';
import debug from 'debug';

const compute = google.compute('v1');
const log = {
	error: debug('mcm:error'),
	info: debug('mcm:info')
};
const minecraftEnv = {
	host: process.env.MC_SERVER || 'localhost',
	port: process.env.MC_PORT || 25565
};
const computeEnv = {
	project: process.env.GC_PROJECT,
	zone: process.env.GC_ZONE,
	instance: process.env.GC_INSTANCE
};

export default function createServer (minecraftConfig = minecraftEnv, computeConfig = computeEnv) {
	let monitorTimer;
	let noPlayers;
	let starting = false;
	let stopping = false;
	let server = new EventEmitter();

	function clearTimer () {
		if (monitorTimer) {
			clearInterval(monitorTimer);
			monitorTimer = null;
			log.info('Monitoring stopped');
		}
	}

	function authGoogleCompute (callback) {
		// Get the appropriate type of credential client, depending upon the runtime environment.
		google.auth.getApplicationDefault((err, authClient) => {
			if (err) {
				log.error(err);
			}
			// The createScopedRequired method returns true when running on GAE or a local developer
			// machine. In that case, the desired scopes must be passed in manually. When the code is
			// running in GCE or a Managed VM, the scopes are pulled from the GCE metadata server.
			// See https://cloud.google.com/compute/docs/authentication for more information.
			if (authClient.createScopedRequired && authClient.createScopedRequired()) {
				// Scopes can be specified either as an array or as a single, space-delimited string.
				authClient = authClient.createScoped(['https://www.googleapis.com/auth/compute']);
			}
			callback(err, authClient);
		});
	}

	function getStatus (callback) {
		mcping(minecraftConfig.host, minecraftConfig.port, (err, stat) => {
			if (!err) {
				['num_players', 'max_players'].forEach((prop) => {
					if (stat[prop] !== undefined) {
						stat[prop] = Number(stat[prop]);
					}
				});
				log.info(stat);
			}
			callback(err, stat);
		});
	}

	function monitor() {
		clearTimer();
		log.info('Monitoring started');
		monitorTimer = setInterval(() => {
			server.getStatus((err, stat) => {
				if (err) {
					return log.error(err);
				}
				if (stat.num_players === 0 && noPlayers) {
					server.emit('empty');
				}
				noPlayers = (stat.num_players === 0);
				server.emit('stat', stat);
			});
		}, 1000 * 60 * 5);
	}

	function start (callback) {
		callback = callback || function() {};
		if (starting) {
			return callback(new Error('Already trying to start server!'));
		}
		starting = true;
		callback = callback || function() {};
		log.info('Attempting to start Minecraft server');
		authGoogleCompute((err, authClient) => {
			if (err) {
				starting = false;
				return callback(err);
			}
			computeConfig.auth = authClient;
			compute.instances.start(computeConfig, (err) => {
				if (err) {
					log.error(err);
					starting = false;
					return callback(err);
				}
				log.info('Server started');
				server.emit('start');
				callback();
				starting = false;
			});
		});
	}

	function stop (callback) {
		callback = callback || function() {};
		if (stopping) {
			return callback(new Error('Already trying to stop server!'));
		}
		stopping = true;
		log.info('Attempting to stop Minecraft server');
		authGoogleCompute((err, authClient) => {
			if (err) {
				stopping = false;
				return callback(err);
			}
			computeConfig.auth = authClient;
			compute.instances.stop(computeConfig, (err) => {
				if (err) {
					log.error(err);
					stopping = false;
					return callback(err);
				}
				log.info('Stopped server');
				server.emit('stop');
				callback();
				stopping = false;
			});
		});
	}

	server.start = start;
	server.stop = stop;
	server.getStatus = getStatus;
	server.monitor = monitor;

	server.on('empty', server.stop);
	server.on('start', server.monitor);
	server.on('stop', clearTimer);

	// check if server is already running
	server.getStatus(function(err) {
		if (!err) {
			log.info('Minecraft server already running');
			server.emit('start');
		}
	});

	return server;

}