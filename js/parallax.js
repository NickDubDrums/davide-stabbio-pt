// Parallax semplice su elementi con data-parallax data-speed="0.2"
const items = [...document.querySelectorAll('[data-parallax]')];
let ticking = false;

function onScroll(){
  if (!ticking){ requestAnimationFrame(update); ticking = true; }
}
function update(){
  const y = window.scrollY || window.pageYOffset;
  items.forEach(el => {
    const speed = parseFloat(el.dataset.speed || '0.2');
    el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
  });
  ticking = false;
}
document.addEventListener('scroll', onScroll, { passive: true });
update();
