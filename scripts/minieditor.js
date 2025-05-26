/* Not checked for performance */
let lineNumbers = document.getElementById('lineNumbers');

let lines = lineNumbers.nextElementSibling.textContent.split("\n");
lineNumbers.nextElementSibling.innerHTML = lines.map((item) => {
  if (!item.trim()) return '<br>';

  let line = item.trim().replace(/{TAB}/g, "&emsp;").replace(/{BOLD} /g, "<b>").replace(/ {\/BOLD}/g, "</b>");
  
  let splitLine = line.split(/(&emsp; )+/);
  let lineContent = splitLine[splitLine.length - 1];
  
  // Only wrap non-tag characters in spans
  line = line.slice(0, line.length - lineContent.length) + lineContent.split(/(<\/?b>)/).reduce((acc, part, index, arr) => acc + (part.match(/(<\/?b>)/) ? part : [...part].map((ch, i) => `<span style="--charIndex: ${arr.slice(0, index).filter((p) => !p.match(/(<\/?b>)/)).join("").length + i}">${ch}</span>`).join("")), "");
  
  return `<div>${line}</div>`;
}).join("");

lineNumbers.innerHTML = lines.fill().map((item, i) => `<div>${i + 1}</div>`).join("");

/* Set active line */

let lastKnownCursorX = -1;
const cursorX_update_threshold = 8; // px
function updateActiveLine(cursorX, cursorY) {
  /* Vertical */
  
  debounce(() => {
    const segmentHeight = lineNumbers.parentElement.parentElement.offsetHeight / lines.length;
    
    const activeLine = Math.ceil(cursorY / segmentHeight);
    
    lineNumbers.nextElementSibling.style.setProperty('--activeLine', activeLine + '');
    lineNumbers.nextElementSibling.style.setProperty('--maxLines', lines.length + '');
  }, 250)();
  
  /* Horizontal */

  if (Math.abs(cursorX - lastKnownCursorX) > cursorX_update_threshold) {
      lastKnownCursorX = cursorX;

      let horizontalPos = cursorX / document.body.clientWidth;
      let padding = lineNumbers.nextElementSibling.offsetLeft / lineNumbers.parentElement.offsetWidth;
      let horizontalRePos = ((1 - (padding * 2)) * horizontalPos) + padding;
      lineNumbers.nextElementSibling.style.setProperty('--intensityPos', roundNumber(horizontalRePos * 100) + '%');
  }
}

/* Animate Editor being built - First time */

function onFirstView(e) {
  if (e.animationName != 'viewed') return;
  lineNumbers.parentElement.classList.add('viewed');
  lineNumbers.parentElement.removeEventListener("animationstart", onFirstView);
}