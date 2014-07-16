$(document).ready(function () {
  // Switch from empty anchors to id-ed headings
  $('a[name]').get().forEach(function (i) {
    var $i = $(i);

    $i.next().attr('id', $i.attr('name'));
    $i.detach();
  });

  $('.scroll-spy-target').on('activate.bs.scrollspy', function (event) {
    var $this = $(this);
    var $target = $(event.target);

    $this.scrollTo($target, 0, {
      offset: -($this.innerHeight() / 2)
    });
  });

  function truncate(json, length) {
    if (length == null) {
      length = 20;
    }

    var split = json.split('\n');

    if (split.length <= length) {
      return json;
    }

    return split.slice(0, length).join('\n') + '\n...';
  }

  $('[data-route]').each(function () {
    // For now, GET only.
    var $this = $(this);
    var $target = $($this.attr('data-target'));
    var route = $this.attr('data-route');
    var length = $this.attr('data-truncate') || Infinity;

    $this.click(function () {
      $target.text('Loading ' + route + ' ...');

      $.ajax(route, {
        success: function (data) {
          var json = truncate(JSON.stringify(data, null, 2), length);
          $target.text(json);
        }
      });

      console.log($this.attr('data-route'));
    });
  });
});
