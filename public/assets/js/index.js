
    if (!localStorage.getItem("transport")) {
    localStorage.setItem("transport", "epoxy");
    }

    if (!localStorage.getItem("searchEngine")) {
    localStorage.setItem("searchEngine", "duckduckgo");
    }

    if (!localStorage.getItem("ab")) {
    localStorage.setItem("ab", "true");
    }



function updateTime() {
    const now = new Date();
    const clock = document.getElementById('clock');
    const date = document.getElementById('date');
    clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    date.textContent = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
setInterval(updateTime, 1000);
updateTime();

// Battery API
navigator.getBattery().then(battery => {
    const batteryPercent = document.getElementById('battery');
    const batteryIcon = document.getElementById('battery-icon');

    function updateBattery() {
        let level = Math.round(battery.level * 100);
        batteryPercent.textContent = level + '%';

        if(level <= 20){
            batteryIcon.className = 'fa-solid fa-battery-empty battery-low';
        } else if(level <= 60){
            batteryIcon.className = 'fa-solid fa-battery-half battery-medium';
        } else {
            batteryIcon.className = 'fa-solid fa-battery-full battery-high';
        }
    }

    battery.addEventListener('levelchange', updateBattery);
    updateBattery();
});

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

