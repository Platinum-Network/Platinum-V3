fetch('/assets/data/activities.json')
  .then(response => {
    if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
    return response.json();
  })
  .then(games => {
    // Sort games alphabetically by name
    games.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const appsContainer = document.querySelector('.games');
    const searchInput = document.getElementById('input');

    // Setup search input
    searchInput.type = 'text';
    searchInput.placeholder = 'Search games...';
    appsContainer.parentNode.insertBefore(searchInput, appsContainer);

    // Function to display games
    function displayGames(gamesToDisplay) {
      appsContainer.innerHTML = ''; // Clear previous games
      gamesToDisplay.forEach(game => {
        const gameElement = document.createElement('div');
        gameElement.className = 'card';
        gameElement.innerHTML = `
          <img src="${game.image}" alt="${game.name}">
          <h3>${game.name}</h3>
        `;

        // Add click handler
        gameElement.addEventListener('click', () => {
          run(game.url);
        });

        appsContainer.appendChild(gameElement);
      });
    }

    // Initial display
    displayGames(games);

    // Search functionality
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      const filteredGames = games.filter(game =>
        game.name.toLowerCase().includes(query)
      );
      displayGames(filteredGames);
    });
  })
  .catch(error => console.error('Error loading games:', error));

function run(url) {
  const encodedUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
  localStorage.setItem("url", encodedUrl);
  sessionStorage.setItem("Url", encodedUrl);
  window.location.href = "/quiz";
}
