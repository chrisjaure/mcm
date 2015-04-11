# mcm
Startup and shutdown a minecraft server running on Google Cloud Compute.

Minecraft sever usage will be monitored and the instance will be shut down automatically after 10 minutes of inactivity.

## Command Line Usage

```
npm start <port>
```

## Environment Variables

All of these environment variables are required to be set unless otherwise noted.

- `GC_INSTANCE`: Google Cloud Compute instance name or id that is running the Minecraft server.
- `GC_PROJECT`: Google Cloud project that the instance is in.
- `GC_ZONE`: Google Cloud zone that the instance is in.
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to Google Cloud json credentials. More info [here](https://developers.google.com/identity/protocols/application-default-credentials#howtheywork).
- `MC_SERVER`: Minecraft server hostname or ip. Optional, defaults to `localhost`.
- `MC_PORT`: Minecraft server port. Optional, defaults to `25565`.

## Debug Environment Variables

More info can be printed to stdout by setting the DEBUG environment variable to any of the following values:

- `mcm:error`: Print errors.
- `mcm:info`: Print extra info.
- `mcm:server`: Print server errors.
- `mcm:*`: Print all logs.