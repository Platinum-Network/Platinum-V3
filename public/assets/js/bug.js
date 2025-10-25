// Create the button
const bugButton = document.createElement('button');
bugButton.textContent = 'Report Bug';

// Style it
Object.assign(bugButton.style, {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  padding: '10px 20px',
  backgroundColor: '#f44336',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  zIndex: 9999,
  fontSize: '16px',
});

// Add click event
bugButton.addEventListener('click', () => {
  window.location.href = '/bug';
});

// Add button to the page
document.body.appendChild(bugButton);
