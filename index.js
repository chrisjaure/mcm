var mcping = require('mc-ping');
var google = require('googleapis');
var compute = google.compute('v1');
var EventEmitter = require('eventemitter3');
var debug = require('debug');
var log = {
	error: debug('mcm:error'),
	info: debug('mcm:info')
};

var minecraftEnv = {
	host: process.env.MC_SERVER || 'localhost',
	port: process.env.MC_PORT || 25565
};

var computeEnv = {
	project: process.env.GC_PROJECT,
	zone: process.env.GC_ZONE,
	instance: process.env.GC_INSTANCE
};

var starting = false;
var stopping = false;

module.exports = function createServer (minecraftConfig, computeConfig) {
	var monitorTimer;
	var noPlayers;
	var server = new EventEmitter();

	minecraftConfig = minecraftConfig || minecraftEnv;
	computeConfig = computeConfig || computeEnv;

	function clearTimer () {
		if (monitorTimer) {
			clearInterval(monitorTimer);
			monitorTimer = null;
			log.info('Monitoring stopped');
		}
	}

	function authGoogleCompute (callback) {
		// Get the appropriate type of credential client, depending upon the runtime environment.
		google.auth.getApplicationDefault(function(err, authClient) {
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
		mcping(minecraftConfig.host, minecraftConfig.port, function(err, stat) {
			if (!err) {
				['num_players', 'max_players'].forEach(function(prop) {
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
		monitorTimer = setInterval(function() {
			server.getStatus(function(err, stat) {
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
		authGoogleCompute(function(err, authClient) {
			if (err) {
				starting = false;
				return callback(err);
			}
			computeConfig.auth = authClient;
			compute.instances.start(computeConfig, function(err) {
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
		callback = callback || function() {};
		log.info('Attempting to stop Minecraft server');
		authGoogleCompute(function(err, authClient) {
			if (err) {
				stopping = false;
				return callback(err);
			}
			computeConfig.auth = authClient;
			compute.instances.stop(computeConfig, function(err) {
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

	server.on('empty', function() {
		server.stop();
	});
	server.on('start', function() {
		server.monitor();
	});
	server.on('stop', clearTimer);

	// check if server is already running
	server.getStatus(function(err) {
		if (!err) {
			log.info('Minecraft server already running');
			server.emit('start');
		}
	});

	return server;

};