const cursorPosition = { x: 0, y: 0 };
const smoothing = 0.05;

function animateCursor() {
    if (!window.cursorX || !window.cursorY) return requestAnimationFrame(animateCursor);
    
    let dx = window.cursorX - cursorPosition.x;
    let dy = window.cursorY - cursorPosition.y;
    
    cursorPosition.x += dx * smoothing;
    cursorPosition.y += dy * smoothing;

    if (cssBadge.classList.contains('hover-animation')) {
        // Apply the smoothed position to the cursor element
        // Using Math.round to avoid sub-pixel rendering issues on some browsers
        cursor.style.translate = `calc(${Math.round(cursorPosition.x)}px - 50%) calc(${Math.round(cursorPosition.y)}px - 50%)`;
    }

    // Loop this function for the next frame
    requestAnimationFrame(animateCursor);
}
animateCursor();