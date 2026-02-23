const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const yearEl = document.getElementById('year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear().toString();
}

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', (!expanded).toString());
    nav.classList.toggle('is-open');
  });

  nav.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

const topBar = document.querySelector('.top-bar');
if (topBar) {
  const onScroll = () => {
    if (window.scrollY > 8) {
      topBar.classList.add('has-shadow');
    } else {
      topBar.classList.remove('has-shadow');
    }
  };
  window.addEventListener('scroll', onScroll);
  onScroll();
}
