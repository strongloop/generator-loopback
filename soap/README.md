# loopback-soap

Utilities to transform between SOAP WSDL and LoopBack remoting metadata.

This is an internal module used by the following user-facing tools:

 - ['lb soap' command in loopback-cli](https://github.com/strongloop/loopback-cli)


## Installation

To install the LoopBack CLI tool:

```
$ npm install -g loopback-cli
```

## Use


 1. Run `lb` to create a new LoopBack application.
 2. `cd` to newly created application directory.
 3. Run `lb soap` When prompted, enter WSDL URL or local wsdl file path.
 5. In the next prompts, select 'service', 'binding' and one or more WSDL operations to generate remote methods and models.
 4. Run `node .` to start the server.
 5. Browse your REST API at http://0.0.0.0:3000/explorer and test the generated REST APIs.

