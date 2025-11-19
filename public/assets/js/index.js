
    if (!localStorage.getItem("transport")) {
    localStorage.setItem("transport", "epoxy");
    }

    if (!localStorage.getItem("searchEngine")) {
    localStorage.setItem("searchEngine", "duckduckgo");
    }

    if (!localStorage.getItem("ab")) {
    localStorage.setItem("ab", "true");
    }

    if (input) {
        let placeholderText = "Search the Web Freely..."; 
        function overwritePlaceholder() {
            input.placeholder = placeholderText;
            requestAnimationFrame(overwritePlaceholder);
        }
        requestAnimationFrame(overwritePlaceholder);
    } else {
        console.error("Element with ID 'input' not found.");
    }

