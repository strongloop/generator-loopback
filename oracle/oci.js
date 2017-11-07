'use strict';

var path = require('path');
var fs = require('fs');
var glob = require('glob');
var os = require('os');

function parsePath(pathStr) {
  if (!pathStr) return [];
  return pathStr.split(path.delimiter);
}

function searchFileOnPath(pathStr, file, log) {
  var paths = parsePath(pathStr);
  for (var i = 0, n = paths.length; i < n; i++) {
    if (paths[i]) {
      var f = path.join(paths[i], file);
      if (log) log('Searching ' + f);
      if (fs.existsSync(f)) {
        if (log) log('Found: ' + f);
        return paths[i];
      }
    }
  }
  return null;
}

function discoverOCI(log) {
  var libDir = process.env.OCI_LIB_DIR;
  var incDir = process.env.OCI_INC_DIR;

  var platform = process.platform;

  var libDirs = [];
  var libFile = 'libclntsh.so';

  var incDirs = [];
  var headerFile = 'oci.h';

  if (platform === 'linux') {
    libFile = 'libclntsh.so';
    libDirs = [
      process.env.OCI_LIB_DIR,
      '/usr/lib/oracle/*/client*/lib',
      '/opt/oracle/instantclient',
      path.join(os.homedir(), 'oracle-instant-client'),
      process.env.ORACLE_HOME && path.join(process.env.ORACLE_HOME, 'lib'),
    ];
    incDirs = [
      process.env.OCI_INC_DIR,
      '/usr/lib/oracle/*/client*/lib',
      '/opt/oracle/instantclient/sdk/include',
      path.join(os.homedir(), 'oracle-instant-client/sdk/include'),
      process.env.ORACLE_HOME && path.join(process.env.ORACLE_HOME, 'rdbms/public'),
    ];
  }

  if (platform === 'solaris') {
    libFile = 'libclntsh.so';
    libDirs = [
      process.env.OCI_LIB_DIR,
      '/opt/oracle/instantclient',
      path.join(os.homedir(), 'oracle-instant-client'),
    ];
    incDirs = [
      process.env.OCI_INC_DIR,
      '/opt/oracle/instantclient/sdk/include',
      path.join(os.homedir(), 'oracle-instant-client/sdk/include'),
    ];
  }

  if (platform === 'darwin') {
    libFile = 'libclntsh.dylib';
    libDirs = [
      process.env.OCI_LIB_DIR,
      '/opt/oracle/instantclient',
      path.join(os.homedir(), 'oracle-instant-client'),
    ];
    incDirs = [
      process.env.OCI_INC_DIR,
      '/opt/oracle/instantclient/sdk/include',
      path.join(os.homedir(), 'oracle-instant-client/sdk/include'),
    ];
  }

  if (platform === 'win32') {
    libFile = 'oci.lib';
    libDirs = [
      process.env.OCI_LIB_DIR,
      'C:\\oracle\\instantclient\\sdk\\lib\\msvc',
      path.join(os.homedir(), 'oracle-instant-client'),
    ];
    incDirs = [
      process.env.OCI_INC_DIR,
      'C:\\oracle\\instantclient\\sdk\\include',
      path.join(os.homedir(), 'oracle-instant-client/sdk/include'),
    ];
  }

  var i, n, files;

  for (i = 0, n = libDirs.length; i < n; i++) {
    if (libDirs[i]) {
      var p = path.join(libDirs[i], libFile);
      if (log) log('Searching ' + p);
      files = glob.sync(p);
      if (log) log('Found: ' + files);
      if (files.length) {
        libDir = path.normalize(path.dirname(files[0]));
        break;
      }
    }
  }

  for (i = 0, n = incDirs.length; i < n; i++) {
    if (incDirs[i]) {
      var h = path.join(incDirs[i], headerFile);
      if (log) log('Searching ' + h);
      files = glob.sync(h);
      if (log) log('Found: ' + files);
      if (files.length) {
        incDir = path.normalize(path.dirname(files[0]));
        break;
      }
    }
  }

  var dylibDir = '';
  if (process.platform === 'linux') {
    dylibDir = searchFileOnPath(process.env.LD_LIBRARY_PATH,
      'libclntsh.so', log);
  }
  if (process.platform === 'win32') {
    dylibDir = searchFileOnPath(process.env.PATH, 'oci.dll', log);
  }
  if (process.platform === 'darwin') {
    dylibDir = searchFileOnPath(process.env.DYLD_LIBRARY_PATH || libDir,
      'libclntsh.dylib', log);
  }
  return {
    libDir: libDir,
    incDir: incDir,
    dylibDir: dylibDir,
  };
}

function detectClientPlatform() {
  var platforms = {
    darwin: 'MacOSX',
    linux: 'Linux',
    win32: 'Windows',
  };

  var archs = {
    ia32: 'x86',
    x64: 'x64',
  };

  var info = {
    platform: platforms[process.platform] || process.platform,
    arch: archs[process.arch] || process.arch,
    node: process.versions.node,
    abi: process.versions.modules,
  };
  var pkg = {};
  try {
    pkg =
      require('./node_modules/loopback-connector-oracle/package.json').config;
  } catch (e) {
    // ignore;
  }
  var base = pkg.oracleUrl ||
    ('http://7e9918db41dd01dbf98e-ec15952f71452bc0809d79c86f5751b6.' +
    'r22.cf1.rackcdn.com');
  var version = pkg.oracleVersion || '2.0.0';
  var url = base + '/loopback-oracle-' + info.platform + '-' + info.arch +
    '-abi' + info.abi + '-' + (version || info.version) + '.tar.gz';

  info.prebuiltBundle = url;
  return info;
}

exports.discoverOCI = discoverOCI;
exports.detectClientPlatform = detectClientPlatform;

