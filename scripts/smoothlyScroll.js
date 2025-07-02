const lenis = new Lenis({
    wrapper: scrollWrapper,
    autoResize: true 
})

function raf(time) {
  lenis.raf(time)
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
        
        if (lenis) lenis.scrollTo(targetElement, {
          duration: 1.5,
          lock: true
        });
        else scrollWrapper.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth'
        });
    });
});