let cssBadge = document.getElementById('nycssBadge');

// Variable to keep track of the timer
let scrollTimer, hovered = false;

// Event listener for scroll events
updateLogoState();
function updateLogoState() {
  if (scrollTimer) clearTimeout(scrollTimer);

  const { pageYOffset, document: { documentElement: { scrollTop, scrollHeight, clientHeight } } } = window;

  // Check if user is at the bottom
  if (((pageYOffset || scrollTop) / scrollHeight) < 0.01) {
    cssBadge.className = '';
  } else if ((((pageYOffset || scrollTop) + clientHeight) / scrollHeight) >= 0.9995) {
    cssBadge.className = 'hover-animation';
    if (!hovered) hovered ^= 1;
  } else if (cssBadge.className != 'main-animation') {
    cssBadge.className = 'main-animation';
    if (hovered) hovered ^= 1;
  } else {
    scrollTimer = setTimeout(() => {
      if (cssBadge.className == 'main-animation') cssBadge.className = 'idle-animation';
    }, 1000);
  }
}