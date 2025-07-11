let currentLenis;

const mainSettings = scrollWrapper.querySelector('#mainSettings');
window.isNesting = mainElement.classList.contains('nesting');

const updateLenisTarget = () => {
  const target = window.isNesting ? mainSettings : scrollWrapper;

  if (currentLenis) currentLenis.destroy();

  currentLenis = new Lenis({
      wrapper: target,
      autoResize: true
  });
};

const observer = new MutationObserver(() => {
  const isCurrentlyNesting = mainElement.classList.contains('nesting');

  if (isCurrentlyNesting !== window.isNesting) {
    window.isNesting = isCurrentlyNesting;

    document.getElementById('nestBtn').toggleAttribute('disabled', true);
    setTimeout(() => document.getElementById('nestBtn').toggleAttribute('disabled', false), 2000);
    console.log("test");
    mainElement.firstElementChild.toggleAttribute('inert', !window.isNesting);
    if (window.isNesting) mainElement.nextElementSibling.toggleAttribute('inert', true);

    updateLenisTarget();
  }
});

updateLenisTarget();
observer.observe(mainElement, { attributes: true, attributeFilter: ['class'] });

function raf(time) {
  currentLenis?.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    const targetSelector = this.getAttribute('href');
    let targetElement;

    if (targetSelector == '#') targetElement = scrollWrapper.firstElementChild;
    else targetElement = document.getElementById(targetSelector.slice(1));
    
    if (currentLenis) currentLenis.scrollTo(targetElement, {
      duration: 1.5,
      lock: true
    });
    else scrollWrapper.scrollTo({
      top: targetElement.offsetTop,
      behavior: 'smooth'
    });
  });
});