module.exports = function(RentalLocation, Base) {
  RentalLocation.nearby = function(here, page, max, fn) {
    if (typeof page === 'function') {
      fn = page;
      page = 0;
      max = 0;
    }

    if (typeof max === 'function') {
      fn = max;
      max = 0;
    }

    var limit = 10;
    page = page || 0;
    max = Number(max || 100000);

    RentalLocation.find({
      // find locations near the provided GeoPoint
      where: {geo: {near: here, maxDistance: max}},
      // paging
      skip: limit * page,
      limit: limit
    }, fn);
  };

  RentalLocation.setup = function() {
    Base.setup.apply(this, arguments);

    this.remoteMethod('nearby', {
      description: 'Find nearby locations around the geo point',
      accepts: [
        {arg: 'here', type: 'GeoPoint', required: true,
          description: 'geo location (lat & lng)'},
        {arg: 'page', type: 'Number',
          description: 'number of pages (page size=10)'},
        {arg: 'max', type: 'Number',
          description: 'max distance in miles'}
      ],
      returns: {arg: 'locations', root: true}
    });

    /* TODO(bajtos) this requires `rest` ds using REST connector
       See sls-sample-app/data-sources/rest.js

    this.beforeSave = function(next, loc) {
      // geo code the address
      if (!loc.geo) {
        rest.geocode(loc.street, loc.city, loc.state, function(err, result, res) {
          if (result && result[0]) {
            loc.geo = result[0].lng + ',' + result[0].lat;
            next();
          } else {
            next(new Error('could not find location'));
          }
        });
      } else {
        next();
      }
    };
    */
  };
};
