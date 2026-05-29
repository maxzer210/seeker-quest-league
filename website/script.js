// Nav scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));

// Burger
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger?.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));

// Particles
const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
  const colors = ['#9945FF','#e040fb','#14F195','#06b6d4','#f59e0b'];
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      opacity:${Math.random()*.6+.2};
      animation-duration:${Math.random()*15+8}s;
      animation-delay:-${Math.random()*15}s;
    `;
    particlesContainer.appendChild(p);
  }
}

// Counter animation
function animateCounter(el) {
  const target = +el.dataset.target;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 2000;
  let start = null;
  const step = (ts) => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = Math.floor(eased * target);
    el.textContent = prefix + (target >= 1000000 ? (val / 1000000).toFixed(val >= 1000000000 ? 1 : 0) + (target >= 1000000000 ? 'B' : 'M') : val.toLocaleString()) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = prefix + (target >= 1000000000 ? '1B' : target >= 1000000 ? (target/1000000).toFixed(1)+'M' : target.toLocaleString()) + suffix;
  };
  requestAnimationFrame(step);
}

// Vesting bars animation
function animateVbar(el) {
  const targetW = el.dataset.width;
  el.style.width = targetW + '%';
}

// Intersection observer
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    if (el.dataset.target) animateCounter(el);
    if (el.classList.contains('vbar__fill')) animateVbar(el);
    if (el.classList.contains('tok-card') || el.classList.contains('feature-card') || el.classList.contains('tl-item') || el.classList.contains('step')) {
      const delay = el.dataset.delay || 0;
      setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, +delay);
    }
    io.unobserve(el);
  });
}, { threshold: 0.2 });

document.querySelectorAll('[data-target]').forEach(el => io.observe(el));
document.querySelectorAll('.vbar__fill').forEach(el => io.observe(el));

// Animate cards on scroll
document.querySelectorAll('.tok-card, .tl-item, .step').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  el.dataset.delay = i * 80;
  io.observe(el);
});

// CTA form
const form = document.getElementById('joinForm');
const success = document.getElementById('formSuccess');
form?.addEventListener('submit', e => {
  e.preventDefault();
  form.style.display = 'none';
  if (success) { success.style.display = 'block'; }
});
