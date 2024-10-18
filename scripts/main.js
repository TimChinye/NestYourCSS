function setupDragAndDrop(editor) {
    // Handle drag events and prevent default behavior
    const handleDrag = (e) => {
        e.preventDefault();

        // Highlight editor during dragenter/dragover, remove on dragleave
        if (['dragenter', 'dragover'].includes(e.type)) {
            editor.classList.add('drag-hover');
        } else if (['dragleave', 'drop'].includes(e.type)) {
            editor.classList.remove('drag-hover');
        }
    };

    // Attach only one listener for all drag events except 'drop'
    ['dragenter', 'dragover', 'dragleave'].forEach(eventName => {
        editor.addEventListener(eventName, handleDrag);
    });

    // Handle the 'drop' event for both class removal and file processing
    editor.addEventListener('drop', (e) => {
        handleDrag(e);

        const file = e.dataTransfer.files[0];
        const text = e.dataTransfer.getData('text/plain');

        if (file && (file.type === "text/css" || file.name.endsWith('.css'))) { // css file
            const reader = new FileReader();
            reader.onload = (event) => window.inputEditor.setValue(event.target.result);
            reader.readAsText(file);
        }
        else if (text) { // plain text
            const cursorPosition = window.inputEditor.getCursorPosition();
            window.inputEditor.insertText(cursorPosition, text);
        } else {
            alert("Only .css files or text are allowed!");
        }
    });
}