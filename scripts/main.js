let debounceDelays = {};
const debounce = (func, wait) => {
	return (...args) => {
		if (!debounceDelays[func]) {
			debounceDelays[func] = true;
			func.apply(this, args);
			setTimeout(() => requestAnimationFrame(() => debounceDelays[func] = false), wait);
		}
	};
}

/**
 * This function will round a number to a certain decimal point.
 * 
 * @param {number} num The number being rounded.
 * @param {number} dp The number of decimal points being rounded to.
 * @returns {number}
 */
const roundNumber = (num, dp = 2) => {
	let multiplier = Math.pow(10, dp);
	return Math.floor(num * multiplier) / multiplier;
};

const clone = (obj) => JSON.parse(JSON.stringify(obj));

/** JSON.stringify but also avoids circular references */
function safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    });
}

// Prevents chrome's console for logging references of arrays
console.logNow = ((logFunc) => (...args) => logFunc(...args.map(arg => JSON.parse(safeStringify(arg)))))(console.log);

function isElementInViewport(el) {
    if (!el) return false;
  
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Waits for a global variable to be defined.
 * @param {string} varName The name of the variable on the window object.
 * @returns {Promise<void>}
 */
function waitForVar(varName) {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        console.log(`Waiting for '${varName}'...`);
        if (typeof window[varName] !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }