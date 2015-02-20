var importer = require('../sample-data/import');

module.exports = function(app, cb) {
  if (app.dataSources.db.name !== 'Memory') return;

  console.log('Started the import of sample data.');

  importer(app, function(err) {
    if (err) return cb(err);
    console.log('Sample data was imported.');
    cb();
  });
};
