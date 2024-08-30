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

const roundNumber = (num, dp = 2) => {
	let multiplier = Math.pow(10, dp);
	return Math.floor(num * multiplier) / multiplier;
};

const clone = (obj) => JSON.parse(JSON.stringify(obj));

// JSON.stringify but also avoids circular references
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
console.log = ((logFunc) => (...args) => logFunc(...args.map(arg => JSON.parse(safeStringify(arg)))))(console.log);