document.body.addEventListener('mousemove', (e) => {
  requestAnimationFrame(() => {
    window.cursorX = e.clientX;
    window.cursorY = e.clientY;

    const target = e.target;

    const navButton = target.classList.contains('navButton') ? target : target.closest('.navButton');
    if (navButton) {
      repositionButtonBG(navButton);
    };
    
    if (target === splashTextElem) {
      attemptSplashTextUpdate();
    }
    
    if (target === lineNumbers.parentElement) {
      onFirstView(e);
    }
    
    let editorSection = document.getElementById('groupingStylesTogether');
    if (e.pageY > editorSection.offsetTop - editorSection.offsetHeight && e.pageY < editorSection.offsetTop + (editorSection.offsetHeight * 2)) {
      updateActiveLine();
    }
    
    let mainSection = document.getElementsByTagName('main')[0];
    if (e.pageY > 0 && e.pageY < mainSection.offsetTop + ((mainSection.offsetHeight * (1 / 0.96)) * 2)) {
      moveMainBackground();
    }
    
    let nycssBadge = document.getElementById('nycssBadge');
    if (nycssBadge.className == 'hover-animation') {
      console.log("test");
      debounce(moveCursorBackground, 100)();
    }
  });
});

window.addEventListener('scroll', (e) => {
  requestAnimationFrame(() => {
    window.smoothScrollX = window.scrollX || window.pageXOffset;
    window.smoothScrollY = window.scrollY || window.pageYOffset;

    updateLogoState();
  });
});