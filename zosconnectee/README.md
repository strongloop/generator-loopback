# lb zosconnectee

Utility to configure [loopback-connector-zosconnectee](https://github.com/strongloop/loopback-connector-zosconnectee) data sources.

## Usage

Run the `lb zosconnectee` at the root directory of your LoopBack application.

The command attempts to connect to the z/OS Connect Enterprise Edition server, retrieve the list of available APIs and then configure
the datasource based on the Swagger document for the selected API.
