// Clones an array (without references)
const cloneArray = (obj) => JSON.parse(JSON.stringify(obj));

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
console.logNow = ((logFunc) => (...args) => logFunc(...args.map(arg => JSON.parse(safeStringify(arg)))))(console.log);