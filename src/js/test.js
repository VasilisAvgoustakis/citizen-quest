require('../sass/test.scss');

function resize() {
  $('.scale-fit').each((i, el) => {
    $(el).find('iframe').each((j, iframe) => {
      const width = $(iframe).attr('width');
      const height = $(iframe).attr('height');
      const parentWidth = $(el).parent().width();
      const scale = parentWidth / width;

      $(el).css({
        width: `${width * scale}px`,
        height: `${height * scale}px`,
      });

      $(iframe).css({
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
      });
    });
  });
}

// Throttled resize event
let resizeTimeout;
$(window).on('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    resize();
  }, 100);
});

resize();

// Handle errors within the iframe
$('.station').each((i, container) => {
  $(container).find('iframe').each((j, iframe) => {
    iframe.contentWindow.onerror = () => {
      $(container).addClass('error');
      return false;
    };
  });
});

