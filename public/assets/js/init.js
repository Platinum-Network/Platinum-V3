// =====================
// LocalStorage Defaults
// =====================

// default icon
const CustomIcon = localStorage.getItem("CustomIcon") || (() => {
    const url = "https://ssl.gstatic.com/classroom/favicon.png";
    localStorage.setItem("CustomIcon", url);
    return url;
})();

// default name
const CustomName = localStorage.getItem("CustomName") || (() => {
    const name = "Home";
    localStorage.setItem("CustomName", name);
    return name;
})();

// make clickoff default TRUE
if (localStorage.getItem("clickoff") === null) {
    localStorage.setItem("clickoff", "true");
}

// make AB default TRUE
if (localStorage.getItem("ab") === null) {
    localStorage.setItem("ab", "true");
}

// first-load popup notice
if (!localStorage.getItem("firstOpen")) {
    alert(
        "Please allow popups for this site and refresh. Doing so will allow us to open the site in an about:blank tab and preventing this site from showing up in your history and prevent your teacher from monitoring your screen. You can turn this off in the site settings."
    );
    localStorage.setItem("firstOpen", "true");
}


// =====================
// AB Cloak System
// =====================
(function () {
    'use strict';
    if (localStorage.getItem("ab") !== "true") return;

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

    function applyTab(name = CustomName, icon = CustomIcon) {
        document.title = name;

        let fav = document.querySelector("link[rel='icon']#favicon");
        if (!fav) {
            fav = document.createElement("link");
            fav.id = "favicon";
            fav.rel = "icon";
            document.head.appendChild(fav);
        }
        fav.href = icon;
    }

    applyTab();


    // =====================
    // Clickoff (now default ON)
    // =====================
    if (localStorage.getItem("clickoff") === "true") {
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                applyTab(CustomName, CustomIcon);
            } else {
                applyTab("Google Docs", "/assets/img/docs.webp");
            }
        });
    }


    // =====================
    // Panic Key
    // =====================
    const panicKey = localStorage.getItem("panicKey") || "Escape";
    document.addEventListener("keydown", (e) => {
        if (e.key === panicKey) {
            location.href = "https://classroom.google.com/";
        }
    });


    // =====================
    // AB open cloaked window
    // =====================
    function AB_Cloak() {
        let framed;
        try { framed = window !== top; }
        catch { framed = true; }

        if (!framed && !navigator.userAgent.includes("Firefox")) {
            const pop = window.open("about:blank", "_blank");
            if (!pop || pop.closed) return;

            const doc = pop.document;
            const iframe = doc.createElement("iframe");

            iframe.src = location.href;
            Object.assign(iframe.style, {
                position: "fixed",
                inset: "0",
                width: "100%",
                height: "100%",
                border: "none"
            });

            doc.body.appendChild(iframe);
            doc.title = CustomName;

            const link = doc.createElement("link");
            link.rel = "icon";
            link.href = CustomIcon;
            doc.head.appendChild(link);

            location.replace(target);
        }
    }

    AB_Cloak();
})();
