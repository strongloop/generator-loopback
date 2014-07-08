var importer = require('../../sample-data/import');

module.exports = function(app) {
  if (app.dataSources.db.name !== 'Memory') return;

  console.error('Started the importing of sample data.');

  importer(app, function(err) {
    if (err) {
      console.error('Cannot import sample data - ', err);
    } else {
      console.error('Sample data was imported.');
    }
  });
};
