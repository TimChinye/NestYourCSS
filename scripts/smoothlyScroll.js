let currentLenis;

window.isNesting = mainElement.classList.contains('nesting');

const updateLenisTarget = async () => {
  const target = window.isNesting ? mainSettings : scrollWrapper;

  if (currentLenis) currentLenis.destroy();

  await waitForVar('Lenis');
  currentLenis = new Lenis({
    wrapper: target,
    autoResize: true
  });
};

function handleNestingChange(isCurrentlyNesting) {
  window.isNesting = isCurrentlyNesting;
  
  // 1. Disable the button immediately to prevent multiple clicks during animation.
  nestBtn.disabled = true;

  codeEditorElem.addEventListener('animationend', () => {console.log('overrr');
    nestBtn.disabled = false;
  }, { once: true });

  mainSettings.toggleAttribute('inert', !window.isNesting);
  sectionsWrapperElement.toggleAttribute('inert', window.isNesting);
  
  updateLenisTarget();
}

const observer = new MutationObserver(() => {
  const isCurrentlyNesting = mainElement.classList.contains('nesting');

  if (isCurrentlyNesting !== window.isNesting) {
    handleNestingChange(isCurrentlyNesting);
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