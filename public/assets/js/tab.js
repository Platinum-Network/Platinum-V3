const tabsBar = document.getElementById('tabs-bar');
const iframeContainer = document.getElementById('iframe-container');
const addTabBtn = document.getElementById('add-tab');
let tabIdCounter = 0;

function activateTab(tab, iframe) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  document.querySelectorAll('iframe').forEach(f => f.classList.remove('active'));
  iframe.classList.add('active');
}

function addTab(url = 'https://example.com') {
  const id = ++tabIdCounter;

  const tab = document.createElement('div');
  tab.className = 'tab';
  tab.dataset.tabId = id;
  tab.innerHTML = `<span>Loading...</span><span class="close-btn">×</span>`;
  tabsBar.insertBefore(tab, addTabBtn);

  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.dataset.tabId = id;
  iframeContainer.appendChild(iframe);

  if (tabIdCounter === 1) activateTab(tab, iframe);

  // Dynamic title
  iframe.addEventListener('load', () => {
    try {
      const title = iframe.contentDocument.title || url;
      tab.querySelector('span:first-child').innerText = title;
    } catch {
      const domain = (new URL(url)).hostname;
      tab.querySelector('span:first-child').innerText = domain;
    }
  });

  tab.addEventListener('click', e => {
    if (e.target.classList.contains('close-btn')) return;
    activateTab(tab, iframe);
  });

  tab.querySelector('.close-btn').addEventListener('click', e => {
    e.stopPropagation();
    const isActive = tab.classList.contains('active');
    tab.remove();
    iframe.remove();
    if (isActive) {
      const remainingTabs = document.querySelectorAll('.tab');
      if (remainingTabs.length) {
        const lastTab = remainingTabs[remainingTabs.length - 1];
        const lastIframe = document.querySelector(`iframe[data-tab-id="${lastTab.dataset.tabId}"]`);
        activateTab(lastTab, lastIframe);
      }
    }
  });
}

// Add initial tabs
addTab('/test');

addTabBtn.addEventListener('click', () => addTab('/search'));