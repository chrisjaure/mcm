import proxyquire from 'proxyquire';

describe('mcm api', () => {
	var mcm, mocks, instancesSpy, authSpy;
	var interval = 1000 * 60 * 5;
	beforeEach(() => {
		jasmine.clock().install();
		instancesSpy = jasmine.createSpyObj('instances', ['start', 'stop']);
		authSpy = jasmine.createSpyObj('auth', ['getApplicationDefault']);
		mocks = {
			'mc-ping': jasmine.createSpy('mc-ping'),
			googleapis: {
				compute: () => {
					return {
						instances: instancesSpy
					};
				},
				auth: authSpy
			}
		};
		mcm = proxyquire('../src', mocks);
	});
	afterEach(() => {
		jasmine.clock().uninstall();
	});
	it('should create server', () => {
		var server = mcm();
		expect(server.start).toBeDefined();
		expect(server.stop).toBeDefined();
		expect(server.getStatus).toBeDefined();
	});
	it('should get initial status', () => {
		var server = mcm();
		expect(mocks['mc-ping']).toHaveBeenCalled();
	});
	describe('getStatus()', () => {
		it('should call mc-ping with default values', () => {
			var server = mcm();
			mocks['mc-ping'].calls.reset();
			server.getStatus();
			expect(mocks['mc-ping']).toHaveBeenCalledWith('localhost', 25565, jasmine.any(Function));
		});
		it('should call mc-ping with ENV vars', () => {
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
		it('should convert appropriate values to Numbers', () => {
			var callback = jasmine.createSpy('getStatusCallback');
			var server = mcm();
			mocks['mc-ping'].and.callFake((server, port, cb) => {
				cb(null, { num_players: '1', max_players: '20', server_name: 'test' });
			});
			server.getStatus(callback);
			expect(callback).toHaveBeenCalledWith(null, { num_players: 1, max_players: 20, server_name: 'test' });
		});
		it('should errback', () => {
			var callback = jasmine.createSpy('getStatusCallback');
			var server = mcm();
			mocks['mc-ping'].and.callFake((server, port, cb) => {
				cb('error!');
			});
			server.getStatus(callback);
			expect(callback).toHaveBeenCalledWith('error!', undefined);
		});
	});
	describe('start()', () => {
		beforeEach(() => {
			process.env.GC_PROJECT = 'GC_PROJECT';
			process.env.GC_ZONE = 'GC_ZONE';
			process.env.GC_INSTANCE = 'GC_INSTANCE';
		});
		afterEach(() => {
			process.env.GC_PROJECT = null;
			process.env.GC_ZONE = null;
			process.env.GC_INSTANCE = null;
		});
		it('should authenticate', () => {
			var server = mcm();
			server.start();
			expect(authSpy.getApplicationDefault).toHaveBeenCalled();
		});
		it('should start instance with ENV vars', () => {
			mcm = proxyquire('../src', mocks);
			var server = mcm();
			authSpy.getApplicationDefault.and.callFake((cb) => {
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
		it('should not start instance multiple times', () => {
			var callback = jasmine.createSpy('startCallback');
			var server = mcm();
			server.start();
			server.start(callback);
			expect(callback).toHaveBeenCalledWith(new Error('Already trying to start server!'));
		});
		it('should emit start on success', () => {
			var callback = jasmine.createSpy('startCallback');
			var server = mcm();
			server.on('start', callback);
		    authSpy.getApplicationDefault.and.callFake((cb) => {
				cb(null, 'authClient');
			});
			instancesSpy.start.and.callFake((config, cb) => {
				cb();
			});
			server.start();
			expect(callback).toHaveBeenCalled();
		});
	});
	describe('stop()', () => {
		beforeEach(() => {
			process.env.GC_PROJECT = 'GC_PROJECT';
			process.env.GC_ZONE = 'GC_ZONE';
			process.env.GC_INSTANCE = 'GC_INSTANCE';
		});
		afterEach(() => {
			process.env.GC_PROJECT = null;
			process.env.GC_ZONE = null;
			process.env.GC_INSTANCE = null;
		});
		it('should authenticate', () => {
			var server = mcm();
			server.stop();
			expect(authSpy.getApplicationDefault).toHaveBeenCalled();
		});
		it('should stop instance with ENV vars', () => {
			mcm = proxyquire('../src', mocks);
			var server = mcm();
			authSpy.getApplicationDefault.and.callFake((cb) => {
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
		it('should not stop instance multiple times', () => {
			var callback = jasmine.createSpy('stopCallback');
			var server = mcm();
			server.stop();
			server.stop(callback);
			expect(callback).toHaveBeenCalledWith(new Error('Already trying to stop server!'));
		});
		it('should emit stop on success', () => {
			var callback = jasmine.createSpy('stopCallback');
			var server = mcm();
			server.on('stop', callback);
		    authSpy.getApplicationDefault.and.callFake((cb) => {
				cb(null, 'authClient');
			});
			instancesSpy.stop.and.callFake((config, cb) => {
				cb();
			});
			server.stop();
			expect(callback).toHaveBeenCalled();
		});
	});
	describe('monitor', () => {
	    it('should get status every 5 minutes', () => {
	        var server = mcm();
	        spyOn(server, 'getStatus').and.callFake((cb) => {
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
	    it('should emit empty if no players after 2 pings', () => {
	        var server = mcm();
	        spyOn(server, 'getStatus').and.callFake((cb) => {
	        	cb(null, {
	        		num_players: 0
	        	});
	        });
	        spyOn(server, 'emit');
	        server.monitor();
	        jasmine.clock().tick(interval * 2);
	        expect(server.emit).toHaveBeenCalledWith('empty');
	    });
	    it('should not emit empty if players are joined', () => {
	        var server = mcm();
	        var response = {
        		num_players: 0
        	};
	        spyOn(server, 'getStatus').and.callFake((cb) => {
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
	xit('should stop on empty', () => {
		var server = mcm();
		spyOn(server, 'stop');
	    server.emit('empty');
	    expect(server.stop).toHaveBeenCalled();
	});
	xit('should monitor on start', () => {
	    var server = mcm();
		spyOn(server, 'monitor');
	    server.emit('start');
	    expect(server.monitor).toHaveBeenCalled();
	});
	it('should stop monitoring on stop', () => {
	    var server = mcm();
	    spyOn(server, 'getStatus');
	    server.monitor();
	    server.emit('stop');
	    jasmine.clock().tick(interval);
	    expect(server.getStatus).not.toHaveBeenCalled();
	});
});