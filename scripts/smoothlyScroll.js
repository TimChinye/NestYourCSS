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

async function handleNestingChange(isCurrentlyNesting) {
  window.isNesting = isCurrentlyNesting;

  // Disable the button immediately to prevent spam-clicking during the transition
  nestBtn.disabled = true;


  // Update the 'inert' attribute on the views for accessibility
  mainSettings.toggleAttribute('inert', !window.isNesting);
  sectionsWrapperElement.toggleAttribute('inert', window.isNesting);
  textSideElem.toggleAttribute('inert', window.isNesting);
  
  // Update the Lenis scroller target (whole to page => nesting settings section)
  updateLenisTarget();

  // Re-enable the button after transition has finished
  let animatingElem = window.isNesting ? codeEditorElem : editorSideElem;
  await waitElementTransitionEnd(animatingElem, 3000);
  nestBtn.disabled = false;
}

const observer = new MutationObserver(() => {
  const isCurrentlyNesting = mainElement.classList.contains('nesting');

  if (isCurrentlyNesting !== window.isNesting) handleNestingChange(isCurrentlyNesting);
  
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