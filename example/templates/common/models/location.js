module.exports = function(RentalLocation) {
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

  // Google Maps API has a rate limit of 10 requests per second
  // Seems we need to enforce a lower rate to prevent errors
  var lookupGeo = require('function-rate-limit')(5, 1000, function() {
    var geoService = RentalLocation.app.dataSources.geo;
    geoService.geocode.apply(geoService, arguments);
  });

  RentalLocation.observe('before save', function(ctx, next) {

    var loc = ctx.instance || ctx.data;

    if (loc.geo) return next();

    // geo code the address
    lookupGeo(loc.street, loc.city, loc.state,
      function(err, result) {
        if (result && result[0]) {
          loc.geo = result[0];
          next();
        } else {
          next(new Error('could not find location'));
        }
      });
  });

  RentalLocation.setup = function() {
    RentalLocation.base.setup.apply(this, arguments);

    this.remoteMethod('nearby', {
      description: 'Find nearby locations around the geo point',
      accepts: [
        {arg: 'here', type: 'GeoPoint', required: true,
          description: 'geo location (lng & lat)'},
        {arg: 'page', type: 'Number',
          description: 'number of pages (page size=10)'},
        {arg: 'max', type: 'Number',
          description: 'max distance in miles'}
      ],
      returns: {arg: 'locations', root: true},
      http: { verb: 'GET' }
    });
  };

  RentalLocation.setup();
};
