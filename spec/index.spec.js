var proxyquire = require('proxyquire');

describe('mcm api', function() {
	var mcm, mocks, instancesSpy, authSpy;
	var interval = 1000 * 60 * 5;
	beforeEach(function() {
		jasmine.clock().install();
		instancesSpy = jasmine.createSpyObj('instances', ['start', 'stop']);
		authSpy = jasmine.createSpyObj('auth', ['getApplicationDefault']);
		mocks = {
			'mc-ping': jasmine.createSpy('mc-ping'),
			googleapis: {
				compute: function() {
					return {
						instances: instancesSpy
					};
				},
				auth: authSpy
			}
		};
		mcm = proxyquire('../src', mocks);
	});
	afterEach(function() {
		jasmine.clock().uninstall();
	});
	it('should create server', function() {
		var server = mcm();
		expect(server.start).toBeDefined();
		expect(server.stop).toBeDefined();
		expect(server.getStatus).toBeDefined();
	});
	it('should get initial status', function() {
		var server = mcm();
		expect(mocks['mc-ping']).toHaveBeenCalled();
	});
	describe('getStatus()', function() {
		it('should call mc-ping with default values', function() {
			var server = mcm();
			mocks['mc-ping'].calls.reset();
			server.getStatus();
			expect(mocks['mc-ping']).toHaveBeenCalledWith('localhost', 25565, jasmine.any(Function));
		});
		it('should call mc-ping with ENV vars', function() {
			process.env.MC_SERVER = 'server';
			process.env.MC_PORT = 'port';
			mcm = proxyquire('../src', mocks);
			var server = mcm();
			mocks['mc-ping'].calls.reset();
			server.getStatus();
			expect(mocks['mc-ping']).toHaveBeenCalledWith('server', 'port', jasmine.any(Function));
			process.env.MC_SERVER = null;
			process.env.MC_PORT = null;
		});
		it('should convert appropriate values to Numbers', function() {
			var callback = jasmine.createSpy('getStatusCallback');
			var server = mcm();
			mocks['mc-ping'].and.callFake(function(server, port, cb) {
				cb(null, { num_players: '1', max_players: '20', server_name: 'test' });
			});
			server.getStatus(callback);
			expect(callback).toHaveBeenCalledWith(null, { num_players: 1, max_players: 20, server_name: 'test' });
		});
		it('should errback', function() {
			var callback = jasmine.createSpy('getStatusCallback');
			var server = mcm();
			mocks['mc-ping'].and.callFake(function(server, port, cb) {
				cb('error!');
			});
			server.getStatus(callback);
			expect(callback).toHaveBeenCalledWith('error!', undefined);
		});
	});
	describe('start()', function() {
		beforeEach(function() {
			process.env.GC_PROJECT = 'GC_PROJECT';
			process.env.GC_ZONE = 'GC_ZONE';
			process.env.GC_INSTANCE = 'GC_INSTANCE';
		});
		afterEach(function() {
			process.env.GC_PROJECT = null;
			process.env.GC_ZONE = null;
			process.env.GC_INSTANCE = null;
		});
		it('should authenticate', function() {
			var server = mcm();
			server.start();
			expect(authSpy.getApplicationDefault).toHaveBeenCalled();
		});
		it('should start instance with ENV vars', function() {
			mcm = proxyquire('../src', mocks);
			var server = mcm();
			authSpy.getApplicationDefault.and.callFake(function(cb) {
				cb(null, 'authClient');
			});
			server.start();
			expect(instancesSpy.start).toHaveBeenCalledWith({
				project: 'GC_PROJECT',
				zone: 'GC_ZONE',
				instance: 'GC_INSTANCE',
				auth: 'authClient'
			}, jasmine.any(Function));
		});
		it('should not start instance multiple times', function() {
			var callback = jasmine.createSpy('startCallback');
			var server = mcm();
			server.start();
			server.start(callback);
			expect(callback).toHaveBeenCalledWith(new Error('Already trying to start server!'));
		});
		it('should emit start on success', function() {
			var callback = jasmine.createSpy('startCallback');
			var server = mcm();
			server.on('start', callback);
		    authSpy.getApplicationDefault.and.callFake(function(cb) {
				cb(null, 'authClient');
			});
			instancesSpy.start.and.callFake(function(config, cb) {
				cb();
			});
			server.start();
			expect(callback).toHaveBeenCalled();
		});
	});
	describe('stop()', function() {
		beforeEach(function() {
			process.env.GC_PROJECT = 'GC_PROJECT';
			process.env.GC_ZONE = 'GC_ZONE';
			process.env.GC_INSTANCE = 'GC_INSTANCE';
		});
		afterEach(function() {
			process.env.GC_PROJECT = null;
			process.env.GC_ZONE = null;
			process.env.GC_INSTANCE = null;
		});
		it('should authenticate', function() {
			var server = mcm();
			server.stop();
			expect(authSpy.getApplicationDefault).toHaveBeenCalled();
		});
		it('should stop instance with ENV vars', function() {
			mcm = proxyquire('../src', mocks);
			var server = mcm();
			authSpy.getApplicationDefault.and.callFake(function(cb) {
				cb(null, 'authClient');
			});
			server.stop();
			expect(instancesSpy.stop).toHaveBeenCalledWith({
				project: 'GC_PROJECT',
				zone: 'GC_ZONE',
				instance: 'GC_INSTANCE',
				auth: 'authClient'
			}, jasmine.any(Function));
		});
		it('should not stop instance multiple times', function() {
			var callback = jasmine.createSpy('stopCallback');
			var server = mcm();
			server.stop();
			server.stop(callback);
			expect(callback).toHaveBeenCalledWith(new Error('Already trying to stop server!'));
		});
		it('should emit stop on success', function() {
			var callback = jasmine.createSpy('stopCallback');
			var server = mcm();
			server.on('stop', callback);
		    authSpy.getApplicationDefault.and.callFake(function(cb) {
				cb(null, 'authClient');
			});
			instancesSpy.stop.and.callFake(function(config, cb) {
				cb();
			});
			server.stop();
			expect(callback).toHaveBeenCalled();
		});
	});
	describe('monitor', function() {
	    it('should get status every 5 minutes', function() {
	        var server = mcm();
	        spyOn(server, 'getStatus').and.callFake(function(cb) {
	        	cb(null, {
	        		num_players: 0
	        	});
	        });
	        server.monitor();
	        expect(server.getStatus).not.toHaveBeenCalled();
	        jasmine.clock().tick(interval);
	        expect(server.getStatus).toHaveBeenCalled();
	        jasmine.clock().tick(interval);
	        expect(server.getStatus.calls.count()).toBe(2);
	    });
	    it('should emit empty if no players after 2 pings', function() {
	        var server = mcm();
	        spyOn(server, 'getStatus').and.callFake(function(cb) {
	        	cb(null, {
	        		num_players: 0
	        	});
	        });
	        spyOn(server, 'emit');
	        server.monitor();
	        jasmine.clock().tick(interval * 2);
	        expect(server.emit).toHaveBeenCalledWith('empty');
	    });
	    it('should not emit empty if players are joined', function() {
	        var server = mcm();
	        var response = {
        		num_players: 0
        	};
	        spyOn(server, 'getStatus').and.callFake(function(cb) {
	        	cb(null, response);
	        });
	        spyOn(server, 'emit');
	        server.monitor();
	        jasmine.clock().tick(interval);
	        response.num_players = 1;
	        jasmine.clock().tick(interval);
	        expect(server.emit).not.toHaveBeenCalledWith('empty');
	    });
	});
	it('should stop on empty', function() {
		var server = mcm();
		spyOn(server, 'stop');
	    server.emit('empty');
	    expect(server.stop).toHaveBeenCalled();
	});
	it('should monitor on start', function() {
	    var server = mcm();
		spyOn(server, 'monitor');
	    server.emit('start');
	    expect(server.monitor).toHaveBeenCalled();
	});
	it('should stop monitoring on stop', function() {
	    var server = mcm();
	    spyOn(server, 'getStatus');
	    server.monitor();
	    server.emit('stop');
	    jasmine.clock().tick(interval);
	    expect(server.getStatus).not.toHaveBeenCalled();
	});
});