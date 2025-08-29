(function(){
  var docEl = document.documentElement;
  var mm = window.matchMedia;
  var isMobile = mm && mm('(max-width: 768px)').matches;
  var prefersReduced = mm && mm('(prefers-reduced-motion: reduce)').matches;
  if (isMobile || prefersReduced) {
    docEl.classList.add('is-mobile', 'slim-mode');
  }
  function resizeCanvas(c) {
    var parent = c.parentElement;
    if (!parent) return;
    var dpr = window.devicePixelRatio || 1;
    var w = parent.clientWidth;
    var h = parent.clientHeight;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    c.dispatchEvent(new Event('resize'));
  }
  function applyResponsive(){
    document.querySelectorAll('canvas[data-responsive], .chart-responsive canvas').forEach(resizeCanvas);
  }
  window.addEventListener('resize', applyResponsive);
  applyResponsive();
})();
