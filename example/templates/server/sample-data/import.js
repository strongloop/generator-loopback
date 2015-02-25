/**
 * Run `node import.js` to import the sample data into the db.
 */

var async = require('async');

// sample data
var cars = require('./cars.json');
var customers = require('./customers.json');
var inventory = require('./inventory.json');
var locations = require('./locations.json');

module.exports = function(app, cb) {
  var Inventory = app.models.Inventory;
  var Location = app.models.Location;
  var Customer = app.models.Customer;
  var Car = app.models.Car;
  var db = app.dataSources.db;

  var ids = {
  };

  function importData(Model, data, cb) {
    // console.log('Importing data for ' + Model.modelName);
    Model.destroyAll(function(err) {
      if (err) {
        cb(err);
        return;
      }
      async.each(data, function(d, callback) {
        if (ids[Model.modelName] === undefined) {
          // The Oracle data has Location with ids over 80
          // and the index.html depends on location 88 being present
          ids[Model.modelName] = 80;
        }
        d.id = ids[Model.modelName]++;
        Model.create(d, callback);
      }, cb);
    });
  }

  async.series([
    function(cb) {
      db.autoupdate(cb);
    },

    importData.bind(null, Location, locations),
    importData.bind(null, Car, cars),
    importData.bind(null, Inventory, inventory),
    importData.bind(null, Customer, customers)
  ], function(err/*, results*/) {
    cb(err);
  });
};

if (require.main === module)
  // The import runs automatically during the boot process.
  require('../server');
