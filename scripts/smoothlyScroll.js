const lenis = new Lenis({
    wrapper: document.querySelector('#siteWrapper'),
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

        if (targetSelector == '#') targetElement = document.getElementById('siteWrapper').firstElementChild;
        else targetElement = document.getElementById(targetSelector.slice(1));
        
        if (lenis) {
          // console.log("a", targetElement, targetSelector);
          
          lenis.scrollTo(targetElement, {
            duration: 1.5,
            lock: true
          });
        } else {
          // console.log("b", targetElement, targetSelector);
          scrollWrapper.scrollTo({
            top: targetElement.offsetTop,
            behavior: 'smooth'
          });
        }
    });
});