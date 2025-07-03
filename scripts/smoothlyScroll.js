let currentLenis;

const mainSettings = scrollWrapper.querySelector('#mainSettings');
const mainElement = scrollWrapper.firstElementChild;
var isNesting = mainElement.classList.contains('nesting');


const updateLenisTarget = () => {
  const target = isNesting ? mainSettings : scrollWrapper;

  if (currentLenis) currentLenis.destroy();

  currentLenis = new Lenis({
      wrapper: target,
      autoResize: true
  });
};

const observer = new MutationObserver(() => {
  const isCurrentlyNesting = mainElement.classList.contains('nesting');

  if (isCurrentlyNesting !== isNesting) {
    isNesting = isCurrentlyNesting;

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