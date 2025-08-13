function initializeSmoothScrollAndNestingController() {
  window.isNesting = mainElement.classList.contains('nesting');
  window.currentLenis = null;
  
  const updateLenisTarget = async () => {
    const target = window.isNesting ? mainSettings : scrollWrapper;
  
    if (window.currentLenis) window.currentLenis.destroy();
  
    await waitForVar('Lenis');
    const newLenis = new Lenis({
      wrapper: target,
      autoResize: true
    });

    if (window.currentLenis == null && newLenis.dimensions.wrapper == siteWrapper) {
      // 3. Use the 'scroll' event to check the position
      newLenis.on('scroll', (e) => {
        const maxScrollTop = mainElement.nextElementSibling.offsetHeight;

        // e.scroll contains the current scroll value
        if (e.scroll > maxScrollTop) {
          // 4. If it exceeds the max, clamp it immediately
          newLenis.scrollTo(maxScrollTop, { immediate: true, force: true });
        }
      });
    }

    window.currentLenis = newLenis;
  };
  
  async function handleNestingChange(isCurrentlyNesting) {
    window.isNesting = isCurrentlyNesting;
  
    // Disable the button immediately to prevent spam-clicking during the transition
    nestBtn.disabled = true;
  
    // Update the 'inert' attribute on the views for accessibility
    [mainSettings, mainElement.nextElementSibling, textSideElem].forEach((elem, i) => {
      elem.toggleAttribute('inert', i ? window.isNesting : !window.isNesting);
    });
    
    
    
    // Update the Lenis scroller target (whole to page => nesting settings section)
    updateLenisTarget();
  
    // Re-enable the button after transition has finished
    let animatingElem = window.isNesting ? codeEditorElem : editorSideElem;
    
    if (window.matchMedia('(max-aspect-ratio: 1.097 / 1)').matches) {
      await waitElementTransitionEnd(codeEditor.querySelector('#outputEditorWrapper'), 5000, 'transitionend');
    } else {
      await waitElementTransitionEnd(animatingElem, 5000, 'animationend');
    }
  
    nestBtn.disabled = false;
  
    // Update UI state (Editor <-> Homepage)
    document.title = 'Nest Your CSS - ' + (window.isNesting ? 'Editor' : 'Homepage');
    nestBtn.setAttribute('aria-label', window.isNesting ? "View Homepage" : "Start Nesting");
    toggleBtn.textContent = (window.isNesting) ? 'Start Nesting' : 'Visit Homepage';
  };
  
  const observer = new MutationObserver(() => {
    const isCurrentlyNesting = mainElement.classList.contains('nesting');
  
    if (isCurrentlyNesting !== window.isNesting) handleNestingChange(isCurrentlyNesting);
    
  });
  
  updateLenisTarget();
  observer.observe(mainElement, { attributes: true, attributeFilter: ['class'] });
  
  function raf(time) {
    window.currentLenis?.raf(time)
    requestAnimationFrame(raf)
  };
  requestAnimationFrame(raf);
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
  
      const targetSelector = this.getAttribute('href');
      let targetElement;
  
      if (targetSelector == '#') targetElement = scrollWrapper.firstElementChild;
      else targetElement = document.getElementById(targetSelector.slice(1));
      
      if (window.currentLenis) window.currentLenis.scrollTo(targetElement, {
        duration: 1.5,
        lock: true
      });
      else scrollWrapper.scrollTo({
        top: targetElement.offsetTop,
        behavior: 'smooth'
      });
    });
  });
};