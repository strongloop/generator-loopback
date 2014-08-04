/**
 * Run `node import.js` to import the test data into the db.
 */

var app = require('../server');
var db = app.dataSources.db;

var models = ['AccessToken', 'Role', 'ACL', 'RoleMapping'];
db.autoupdate(models, function(err) {
  if(err) {
    console.error(err);
  } else {
    console.log('Tables are created for ', models);
  }
});
