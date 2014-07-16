var importer = require('../sample-data/import');

module.exports = function(app) {
  if (app.dataSources.db.name !== 'Memory') return;

  console.error('Started the import of sample data.');
  app.importing = true;

  importer(app, function(err) {
    delete app.importing;
    if (err) {
      console.error('Cannot import sample data - ', err);
    } else {
      console.error('Sample data was imported.');
    }
    app.emit('import done', err);
  });
};
