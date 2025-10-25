// Get values from localStorage
let CustomIcon = localStorage.getItem('CustomIcon');
let CustomName = localStorage.getItem('CustomName');

// Check and set defaults if falsy (null, undefined, empty string, etc.)
if (!CustomIcon) {
    CustomIcon = "https://ssl.gstatic.com/classroom/favicon.png";
    localStorage.setItem('CustomIcon', CustomIcon); // Save the default to localStorage
}

if (!CustomName) {
    CustomName = "Home";
    localStorage.setItem('CustomName', CustomName); // Save the default to localStorage
}

// === Full AB Cloak with custom/default title/icon, clickoff, panic key, and redirect ===
(function () {
    'use strict';

    // Only run if AB is enabled
    if (localStorage.getItem("ab") !== "true") return;

    // URLs for random redirect
    const urls = [
        "https://kahoot.it",
        "https://classroom.google.com",
        "https://drive.google.com",
        "https://google.com",
        "https://docs.google.com",
        "https://slides.google.com",
        "https://www.nasa.gov",
        "https://blooket.com",
        "https://clever.com",
        "https://edpuzzle.com",
        "https://khanacademy.org",
        "https://wikipedia.org",
        "https://dictionary.com"
    ];
    const target = localStorage.getItem("pLink") || urls[Math.floor(Math.random() * urls.length)];

    // Custom tab title & favicon, defaults to Home/Classroom
    const customName = localStorage.getItem("CustomName") || "Home";
    const customIcon = localStorage.getItem("CustomIcon") || "https://ssl.gstatic.com/classroom/favicon.png";

    // Ensure favicon element exists for real tab
    let favicon = document.getElementById("favicon");
    if (!favicon) {
        favicon = document.createElement("link");
        favicon.id = "favicon";
        favicon.rel = "icon";
        document.head.appendChild(favicon);
    }
    document.title = customName;
    favicon.setAttribute("href", customIcon);

    // === Clickoff feature ===
    const clickoffEnabled = localStorage.getItem('clickoff') === 'true';
    if (clickoffEnabled) {
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                document.title = customName;
                favicon.setAttribute("href", customIcon);
            } else {
                document.title = "Google Docs";
                favicon.setAttribute("href", "/assets/img/docs.webp"); // disguise icon
            }
        });
    }

    // === Panic key redirect ===
    const panicKey = localStorage.getItem("panicKey") || "Escape";
    document.addEventListener("keydown", (e) => {
        if (e.key === panicKey) {
            window.location.href = "https://classroom.google.com/";
        }
    });

    // === AB Cloak function ===
    function AB() {
        let inFrame;
        try { inFrame = window !== top; } catch (e) { inFrame = true; }

        if (!inFrame && !navigator.userAgent.includes("Firefox")) {
            const popup = window.open("about:blank", "_blank");
            if (!popup || popup.closed) return; // popup blocked

            const doc = popup.document;

            // Full-page iframe pointing to real page
            const iframe = doc.createElement("iframe");
            iframe.src = window.location.href;
            Object.assign(iframe.style, {
                position: "fixed",
                top: "0",
                left: "0",
                bottom: "0",
                right: "0",
                width: "100%",
                height: "100%",
                border: "none",
                outline: "none"
            });
            doc.body.appendChild(iframe);

            // Custom title & icon for popup
            doc.title = customName;
            const link = doc.createElement("link");
            link.rel = "icon";
            link.href = customIcon;
            doc.head.appendChild(link);

            // Redirect original tab to random/fallback URL
            window.location.replace(target);
        }
    }

    AB();
})();
