document.addEventListener('DOMContentLoaded', () => {
    const get = (selector) => document.querySelector(selector);
    const getById = (id) => document.getElementById(id);

    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');

    const themeSelect = get('.theme-select');
    const proxySelect = getById('proxy-select');
    const transSelect = getById('trans-select');
    const engineSelect = getById('engine-select');
    const particlesSelect = getById('p-select');

    const abCheckbox = getById('ab-checkbox');
    const clickoffCheckbox = getById('clickoff-checkbox');
    const panicKeyInput = getById('panicKeyInput');
    const tabTitleInput = getById('tab-title');
    const tabIconInput = getById('tab-icon');

    const predefinedSelect = getById('predefined-options'); 
    const applyPredefinedBtn = getById('apply-predefined');

    const selectElements = [
        { element: themeSelect, key: 'theme' },
        { element: proxySelect, key: 'proxy' },
        { element: transSelect, key: 'transport', default: 'eproxy' },
        { element: engineSelect, key: 'searchEngine', default: 'DuckDuckGo' }
    ];

    // === Load saved values ===
    const loadSelections = () => {
        selectElements.forEach(({ element, key, default: def }) => {
            if (!element) return;
            element.value = localStorage.getItem(key) || def || '';
        });

        if (particlesSelect) particlesSelect.value = localStorage.getItem('particles') || 'true';

        if (abCheckbox) abCheckbox.checked = localStorage.getItem('ab') !== 'false';
        if (clickoffCheckbox) clickoffCheckbox.checked = localStorage.getItem('clickoff') !== 'false';
        if (panicKeyInput) panicKeyInput.value = localStorage.getItem('panicKey') || '';
        if (tabTitleInput) tabTitleInput.value = localStorage.getItem('CustomName') || '';
        if (tabIconInput) tabIconInput.value = localStorage.getItem('CustomIcon') || '';
        if (predefinedSelect) predefinedSelect.value = '';
    };

    // === Auto-save function ===
    const autoSave = (element, key, eventType = 'change') => {
        if (!element) return;
        element.addEventListener(eventType, () => {
            const value = element.type === 'checkbox' ? element.checked : element.value;
            localStorage.setItem(key, value);
        });
    };

    // === Favicon & Title auto-save ===
    const saveCustomIconName = () => {
        const name = tabTitleInput.value.trim();
        const icon = tabIconInput.value.trim();

        if (name) {
            document.title = name;
            localStorage.setItem('CustomName', name);
        }

        if (icon) {
            let link = document.getElementById('tab-favicon');
            if (!link) {
                link = document.createElement('link');
                link.id = 'tab-favicon';
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = icon;
            localStorage.setItem('CustomIcon', icon);
        }
    };

    const applyPredefinedOption = () => {
        const selected = predefinedSelect.value;
        if (!selected) return;
        const [name, icon] = selected.split('|');
        if (name) tabTitleInput.value = name;
        if (icon) tabIconInput.value = icon;
        saveCustomIconName();
    };

    // === Setup auto-save listeners ===
    selectElements.forEach(({ element, key }) => autoSave(element, key));
    if (particlesSelect) autoSave(particlesSelect, 'particles');

    if (abCheckbox) autoSave(abCheckbox, 'ab', 'change');
    if (clickoffCheckbox) autoSave(clickoffCheckbox, 'clickoff', 'change');
    if (panicKeyInput) autoSave(panicKeyInput, 'panicKey', 'input');

    if (tabTitleInput) tabTitleInput.addEventListener('input', saveCustomIconName);
    if (tabIconInput) tabIconInput.addEventListener('input', saveCustomIconName);

    if (applyPredefinedBtn) applyPredefinedBtn.addEventListener('click', applyPredefinedOption);

    // === Menu navigation (unchanged) ===
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            const sectionId = item.getAttribute('data-section');
            contentSections.forEach(sec => sec.classList.remove('active'));

            const activeSection = document.getElementById(sectionId);
            if (activeSection) setTimeout(() => activeSection.classList.add('active'), 50);
        });
    });

    loadSelections();
});

// === Export / Import Functions (unchanged) ===
function exportSaveData() {
    const getCookies = () =>
        document.cookie.split('; ').reduce((acc, cookie) => {
            const [key, value] = cookie.split('=');
            acc[key] = value;
            return acc;
        }, {});

    const getLocalStorage = () =>
        Object.keys(localStorage).reduce((acc, key) => {
            acc[key] = localStorage.getItem(key);
            return acc;
        }, {});

    const data = { cookies: getCookies(), localStorage: getLocalStorage() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'save_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importSaveData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.cookies) Object.entries(data.cookies).forEach(([k, v]) => (document.cookie = `${k}=${v}; path=/`));
                if (data.localStorage) Object.entries(data.localStorage).forEach(([k, v]) => localStorage.setItem(k, v));
                alert('Save data imported successfully!');
            } catch (err) {
                console.error('Failed to import data:', err);
            }
        };
        reader.readAsText(file);
    });

    input.click();
}
