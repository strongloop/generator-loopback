/*global describe, it, before */
/**
 * REST API Tests
 */
var request = require('supertest');
var app = require('../server');
var assert = require('assert');

before(function importSampleData(done) {
  this.timeout(50000);
  if (app.importing) {
    app.on('import done', done);
  } else {
    done();
  }
});

function json(verb, url) {
  return request(app)[verb](url)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/);
}

describe('REST', function() {
  this.timeout(30000);

  /**
   * Expected Input Tests
   */

  describe('Expected Usage', function() {

    describe('GET /api/cars', function() {
      it('should return a list of all cars', function(done) {
        json('get', '/api/cars')
          .expect(200)
          .end(function(err, res) {
            assert(Array.isArray(res.body));
            assert(res.body.length);

            done();
          });
      });
    });

    var carId;

    describe('POST /api/cars', function() {

      it('should create a new car', function(done) {
        json('post', '/api/cars')
          .send({
            vin: 'ebaddaa5-35bb-4b33-a388-87203acb6478',
            year: '2013',
            make: 'Dodge',
            model: 'Taurus',
            image: '/images/car/car_0.jpg',
            carClass: 'suv',
            color: 'white'
          })
          .expect(200)
          .end(function(err, res) {
            assert(typeof res.body === 'object');
            assert(res.body.id, 'must have an id');
            carId = res.body.id;
            done();
          });
      });
    });

    describe('PUT /api/cars/:id', function() {
      it('should update a car with the given id', function(done) {
        json('put', '/api/cars/' + carId)
          .send({
            year: 2000,
            color: 'red'
          })
          .expect(200, function(err, res) {
            var updatedCar = res.body;
            assert(updatedCar);
            assert(updatedCar.id);
            assert.equal(updatedCar.id, carId);
            assert.equal(updatedCar.year, 2000);
            json('get', '/api/cars/' + carId)
              .expect(200, function(err, res) {
                var foundCar = res.body;
                assert.equal(foundCar.id, carId);
                assert.equal(foundCar.year, 2000);
                assert.equal(foundCar.color, 'red');
                done();
              });
          });
      });
    });

    describe('GET /api/locations', function() {
      it('should return a list of locations', function(done) {
        json('get', '/api/locations')
          .expect(200, function(err, res) {
            var locations = res.body;
            assert(Array.isArray(locations));
            assert(locations.length);
            done();
          });
      });
    });

    describe('GET /api/locations/nearby', function() {
      it('should return a list of locations near given point', function(done) {
        var url = '/api/locations/nearby?' +
          'here[lat]=37.7883415&here[lng]=-122.4209035';
        json('get', url)
          .expect(200, function(err, res) {
            var locations = res.body;
            assert(Array.isArray(locations));
            assert.equal(locations[0].name, 'City Rent-a-Car');
            assert.equal(locations[0].city, 'San Francisco');
            assert.equal(locations.length, 10);
            locations.forEach(function(l) {
              assert(l.geo);
              assert.equal(typeof l.geo.lat, 'number');
              assert.equal(typeof l.geo.lng, 'number');
            });
            done();
          });
      });
    });

    describe('GET /api/locations/:id/inventory', function() {
      it('should return a list of inventory for the given location id',
        function(done) {
          json('get', '/api/locations/88/inventory')
            .expect(200, function(err, res) {
              var inventory = res.body;
              inventory.forEach(function(inv) {
                assert.equal(typeof inv.total, 'number');
                assert.equal(typeof inv.available, 'number');
              });
              done();
            });
        }
      );
    });

    describe('/api/customers', function() {
      // hard-coded in sample data
      var credentials = { email: 'foo@bar.com', password: '123456' };
      var token;
      var customerId;

      it('should login existing customer on POST /api/customers/login',
        function(done) {
          json('post', '/api/customers/login?include=user')
            .send(credentials)
            .expect(200, function(err, res) {
              if (err) return done(err);
              token = res.body;
              assert(token.userId !== undefined);
              customerId = token.userId;
              done();
            });
        }
      );

      it('should allow GET /api/customers/{my-id}', function(done) {
        json('get', '/api/customers/' + customerId)
          .set('Authorization', token.id)
          .expect(200, function(err, res) {
            if (err) return done(err);
            assert.equal(res.body.email, token.user.email);
            done();
          });
      });

      it('should not allow GET /api/customers/{another-id}', function(done) {
        json('get', '/api/customers/' + (customerId + 1000))
          .set('Authorization', token.id)
          .expect(401, function(err) {
            done(err);
          });
      });

      it('should logout existing customer on POST /api/customers/logout',
        function(done) {
          json('post', '/api/customers/logout')
            .set('Authorization', token.id)
            .send({})
            .expect(204, done);
        }
      );
    });
  });

  describe('Unexpected Usage', function() {
    describe('POST /api/cars/:id', function() {
      it('should not crash the server when posting a bad id', function(done) {
        json('post', '/api/cars/foobar').send({}).expect(404, done);
      });
    });
  });

});
