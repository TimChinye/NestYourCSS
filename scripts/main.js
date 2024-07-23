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