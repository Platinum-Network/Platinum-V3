// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    var frame = document.getElementById("frame");
    if (!frame) {
        console.error("Iframe with id 'frame' not found");
        return;
    }

    if (typeof __uv$config === "undefined") {
        console.error("__uv$config is not defined");
        return;
    }

    var url = __uv$config.prefix + __uv$config.encodeUrl("https://sentinel.home.kg");
    localStorage.setItem("url", url);

    frame.setAttribute("src", url);
});
