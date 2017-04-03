# lb oracle

Utilities to install and troubleshoot [loopback-connector-oracle](https://github.com/strongloop/loopback-connector-oracle) module.

Please note `loopback-connector-oracle` module depends on Oracle Node.js Driver [oracledb](https://github.com/oracle/node-oracledb),
which is a binary addon. The `oracledb` module requires [Oracle Instant Client](http://www.oracle.com/technetwork/database/features/instant-client/index-097480.html) at
both build and run time. See [Installation Guide for oracledb](https://github.com/oracle/node-oracledb/blob/master/INSTALL.md)
for more information.

## Usage

Run the `lb oracle` at the root directory of your LoopBack application.

```
Usage:
  lb oracle [options]

Options:
  -h,   --help          # Print the generator's options and usage
        --connector     # Install loopback-connector-oracle module
        --driver        # Install oracledb module
        --verbose       # Print verbose information
```
        
The command first tries to detect the presence of Oracle Instant Client and check
if `loopback-connector-oracle` module can be loaded. If `loopback-connector-oracle`
is ready to use, it will print `Oracle connector is ready.` and exit. Otherwise,
the command will print out findings and prompt you to install:
 
- Oracle Instant Client
- loopback-connector-oracle
- oracledb  

