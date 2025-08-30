function nestCode() {
    const annotations = inputEditor.getSession().getAnnotations().filter((a) => a.type == 'error');
    if (annotations.length == 0) {
        outputEditor.getSession().setValue(convertToNestedCSS(inputEditor.getValue()) || '/* Your output CSS will appear here */');
        return true;
    } else {
        console.log('Code Errors:', annotations);
        outputEditor.getSession().setValue('/* Your input CSS contains errors */');
        return false;
        
        // Show a list of the errors if any.
        
        // "Your code doesn't seem to be valid, do you want to try nesting anyways?"
        // "It may not work properly."
    }
};

document.getElementsByTagName('button')[0].addEventListener('click', nestCode);

function convertToNestedCSS(cssProvided, htmlString) {
	window.processMode ??= 1;

    cssProvided = parseCSS(cssProvided);
    cssProvided = beautifyCSS(cssProvided);
    return cssProvided;
};