// === FETCH FIRST ===
fetch('/assets/data/classtools.json')
  .then(response => {
    if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
    return response.json();
  })
  .then(apps => {
    // Create the pinned entry
    const requestApp = {
      url: "https://docs.google.com/forms/d/e/1FAIpQLScXqdq2bDl4sxBiv5TJFOG0oX2j_1hx0CWU8so-vckwYwDtXg/viewform?usp=dialog",
      image: "/assets/img/embed.png",
      name: "Request App"
    };

    // Sort all other apps alphabetically
    apps.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    // Put the Request App entry at the top
    apps.unshift(requestApp);

    const appsContainer = document.querySelector('.apps');
    const searchInput = document.getElementById('input');

    // Setup search input
    searchInput.type = 'text';
    searchInput.placeholder = 'Search apps...';
    appsContainer.parentNode.insertBefore(searchInput, appsContainer);

    // Display function
    function displayApps(appsToDisplay) {
      appsContainer.innerHTML = '';
      appsToDisplay.forEach(app => {
        const appElement = document.createElement('div');
        appElement.className = 'card';
        appElement.innerHTML = `
          <img src="${app.image}" alt="${app.name}">
          <h3>${app.name}</h3>
        `;
        appElement.addEventListener('click', () => {
          run(app.url);
        });
        appsContainer.appendChild(appElement);
      });
    }

    // Initial display
    displayApps(apps);

    // Search functionality (keeps Request App at top)
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      const filteredApps = apps.filter(app =>
        app.name.toLowerCase().includes(query) || app.name === "Request App"
      );

      // Ensure Request App always first in search results
      const requestAppFiltered = filteredApps.find(g => g.name === "Request App");
      const others = filteredApps.filter(g => g.name !== "Request App");
      if (requestAppFiltered) filteredApps.splice(0, filteredApps.length, requestAppFiltered, ...others);

      displayApps(filteredApps);
    });
  })
  .catch(error => console.error('Error loading apps:', error));

// === RUN FUNCTION ===
function run(url) {
  const encodedUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
  localStorage.setItem("url", encodedUrl);
  sessionStorage.setItem("Url", encodedUrl);
  window.location.href = encodedUrl;
}
