# mcm

Utility for managing a Minecraft server running on Google Cloud Compute. Automatically shuts down server after 10 minutes of inactivity.

See [mcm-server](https://github.com/chrisjaure/mcm-server) for a more useful and higher level implementation.


# Installation

```
npm install --save mcm
```

You also need to download [Google Application credentials](https://developers.google.com/identity/protocols/application-default-credentials#howtheywork) and set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the json filepath unless you have authenticated via another method.

# Example

```javascript
import mcm from 'mcm';

let minecraftOptions = {
	host: 'localhost',
	port: '25565'
};
let googleComputeOptions = {
	project: 'random-name-34834',
	zone: 'us-central1-a',
	instance: 'minecraft-instance'
};

const mcServer = mcm(minecraftOptions, googleComputeOptions);

mcServer.getStatus((err, stat) => {
	if (!err) {
		// server already started!
	}
	else {
		// server not started!
		mcServer.start((err) => {
			if (!err) {
				// server started!
				// will shutdown automatically after 10 minutes of inactivity
			}
		})
	}
});
```


# Usage

```javascript
const mcServer = mcm([minecraftOptions], [googleComputeOptions]);
```

- `minecraftOptions` Object: 

	- `host` - Minecraft server host
	- `port` - Minecraft server port

- `googleComputeOptions` Object:

	- `project` - Google Cloud project name
	- `zone` - Google Cloud zone where instance resides
	- `instance` - Google Cloud Compute instance name

`minecraftOptions` defaults to:

```javascript
{ host: process.env.MC_SERVER || 'localhost',
  port: process.env.MC_PORT || 25565 }
```

`googleComputeOptions` defaults to:

```javascript
{ project: process.env.GC_PROJECT,
  zone: process.env.GC_ZONE,
  instance: process.env.GC_INSTANCE }
```

## mcServer.start([callback])

Starts the Google Compute instance.

If present, the callback will be called with any potential errors.

## mcServer.stop([callback])

Stops the Google Compute intance.

If present, the callback will be called with any potential errors.

Called on `'empty'`.

## mcServer.getStatus(callback)

Gets the status of the Minecraft server.

Callback should take two arguments, `err` and `status`.

`status` will contain an object that looks similar to:

```javascript
{ protocol_version: '51',
  minecraft_version: '1.4.7',
  server_name: 'Your Server MOTD',
  num_players: 0,
  max_players: 20 }
```

## mcServer.monitor()

Start monitoring. This will ping the server every 5 minutes. After two pings in which the server is empty, it will emit `'empty'`.

Called on `'start'`.

## Event: 'start'

Emitted after the server is successfully started.

## Event: 'stop'

Emitted after the server is successfully stopped.

## Event: 'empty'

Emitted when the server has no players after 10 minutes.
