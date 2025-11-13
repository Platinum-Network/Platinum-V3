// === FETCH FIRST ===
fetch('/assets/data/activities.json')
  .then(response => {
    if (!response.ok) throw new Error(`Failed to load: ${response.status}`);
    return response.json();
  })
  .then(games => {
    // Create the pinned entry
    const requestGame = {
      url: "https://docs.google.com/forms/d/e/1FAIpQLSduzLmokWfYSNJ5TXz75BFk5689T21DHke9mNgvomM19VsNDQ/viewform?usp=header",
      image: "/assets/img/embed.png",
      name: "Request Game"
    };

    // Sort all other games alphabetically
    games.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    // Put the Request Game entry at the top
    games.unshift(requestGame);

    const appsContainer = document.querySelector('.games');
    const searchInput = document.getElementById('input');

    // Setup search input
    searchInput.type = 'text';
    searchInput.placeholder = 'Search games...';
    appsContainer.parentNode.insertBefore(searchInput, appsContainer);

    // Display function
    function displayGames(gamesToDisplay) {
      appsContainer.innerHTML = '';
      gamesToDisplay.forEach(game => {
        const gameElement = document.createElement('div');
        gameElement.className = 'card';
        gameElement.innerHTML = `
          <img src="${game.image}" alt="${game.name}">
          <h3>${game.name}</h3>
        `;
        gameElement.addEventListener('click', () => {
          run(game.url);
        });
        appsContainer.appendChild(gameElement);
      });
    }

    // Initial display
    displayGames(games);

    // Search functionality (keeps Request Game at top)
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      const filteredGames = games.filter(game =>
        game.name.toLowerCase().includes(query) || game.name === "Request Game"
      );

      // Ensure Request Game always first in search results
      const requestGameFiltered = filteredGames.find(g => g.name === "Request Game");
      const others = filteredGames.filter(g => g.name !== "Request Game");
      if (requestGameFiltered) filteredGames.splice(0, filteredGames.length, requestGameFiltered, ...others);

      displayGames(filteredGames);
    });
  })
  .catch(error => console.error('Error loading games:', error));

// === RUN FUNCTION ===
function run(url) {
  const encodedUrl = __uv$config.prefix + __uv$config.encodeUrl(url);
  localStorage.setItem("url", encodedUrl);
  sessionStorage.setItem("Url", encodedUrl);
  window.location.href = encodedUrl;
}
