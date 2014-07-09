module.exports = function(Car, Base) {
  Car.setup = function() {
    Base.setup.apply(this, arguments);

    this.afterRemote('count', function(ctx, unused, next) {
      console.log('count result', ctx.result);
      next();
    });
  };
};
