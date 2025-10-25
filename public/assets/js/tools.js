fetch('/assets/data/classtools.json')
  .then(response => {
    if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
    return response.json();
  })
  .then(apps => {
    // Sort apps alphabetically by name
    apps.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const appsContainer = document.querySelector('.apps');
    const searchInput = document.getElementById('input');

    // Setup search input
    searchInput.type = 'text';
    searchInput.placeholder = 'Search apps...';
    appsContainer.parentNode.insertBefore(searchInput, appsContainer);

    // Function to display apps
    function displayGames(appsToDisplay) {
      appsContainer.innerHTML = ''; // Clear previous apps
      appsToDisplay.forEach(app => {
        const appElement = document.createElement('div');
        appElement.className = 'card';
        appElement.innerHTML = `
          <img src="${app.image}" alt="${app.name}">
          <h3>${app.name}</h3>
        `;

        // Add click handler
        appElement.addEventListener('click', () => {
          run(app.url);
        });

        appsContainer.appendChild(appElement);
      });
    }

    // Initial display
    displayGames(apps);

    // Search functionality
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      const filteredGames = apps.filter(app =>
        app.name.toLowerCase().includes(query)
      );
      displayGames(filteredGames);
    });
  })
  .catch(error => console.error('Error loading apps:', error));

function run(url) {
  const encodedUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
  localStorage.setItem("url", encodedUrl);
  sessionStorage.setItem("Url", encodedUrl);
  window.location.href = "/quiz";
}
