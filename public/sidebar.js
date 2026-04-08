(function () {
    var themeLink = document.getElementById('theme-stylesheet');
    var saved = localStorage.getItem('theme');

    if (saved === 'dark') {
        themeLink.href = 'dark.css';
    }

    var overlay = document.createElement('div');
    overlay.id = 'settings-overlay';

    var sidebar = document.createElement('div');
    sidebar.id = 'settings-sidebar';

    var sidebarHeader = document.createElement('div');
    sidebarHeader.id = 'settings-header';

    var title = document.createElement('h2');
    title.textContent = 'Settings';

    var closeBtn = document.createElement('button');
    closeBtn.id = 'settings-close';
    closeBtn.innerHTML = '&times;';

    sidebarHeader.appendChild(title);
    sidebarHeader.appendChild(closeBtn);
    sidebar.appendChild(sidebarHeader);

    var themeSection = document.createElement('div');
    themeSection.className = 'settings-section';

    var themeLabel = document.createElement('div');
    themeLabel.className = 'settings-row';

    var themeLabelText = document.createElement('span');
    themeLabelText.textContent = 'Dark mode';

    var toggle = document.createElement('label');
    toggle.className = 'toggle-switch';

    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = saved === 'dark';

    var slider = document.createElement('span');
    slider.className = 'toggle-slider';

    toggle.appendChild(checkbox);
    toggle.appendChild(slider);
    themeLabel.appendChild(themeLabelText);
    themeLabel.appendChild(toggle);
    themeSection.appendChild(themeLabel);
    sidebar.appendChild(themeSection);

    var accountSection = document.createElement('div');
    accountSection.className = 'settings-section';

    var accountTitle = document.createElement('h3');
    accountTitle.className = 'settings-section-title';
    accountTitle.textContent = 'Account';
    accountSection.appendChild(accountTitle);

    var loginBtn = document.createElement('a');
    loginBtn.href = 'accountprofile.html';
    loginBtn.className = 'settings-login-btn';
    loginBtn.textContent = 'Log In';

    accountSection.appendChild(loginBtn);
    sidebar.appendChild(accountSection);

    document.body.appendChild(overlay);
    document.body.appendChild(sidebar);

    checkbox.addEventListener('change', function () {
        var isDark = checkbox.checked;
        themeLink.href = isDark ? 'dark.css' : 'light.css';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    function openSettings() {
        sidebar.classList.add('open');
        overlay.classList.add('open');
    }

    function closeSettings() {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
    }

    overlay.addEventListener('click', closeSettings);
    closeBtn.addEventListener('click', closeSettings);

    var gearBtn = document.createElement('button');
    gearBtn.id = 'settings-btn';
    gearBtn.innerHTML = '&#9881;';
    gearBtn.addEventListener('click', openSettings);

    var header = document.querySelector('.nav-container') || document.querySelector('.topbar');
    if (header) {
        header.appendChild(gearBtn);
    } else {
        gearBtn.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
        document.body.appendChild(gearBtn);
    }

    var style = document.createElement('style');
    style.textContent =
        '#settings-btn{background:none;border:none;font-size:1.6rem;cursor:pointer;color:var(--text-light);padding:4px 8px;transition:color 0.3s;}' +
        '#settings-btn:hover{color:var(--primary-color);}' +
        '#settings-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:9998;opacity:0;pointer-events:none;transition:opacity 0.3s;}' +
        '#settings-overlay.open{opacity:1;pointer-events:auto;}' +
        '#settings-sidebar{position:fixed;top:0;right:-320px;width:300px;height:100%;background:var(--background);box-shadow:var(--shadow-lg);z-index:9999;transition:right 0.3s ease;padding:24px;overflow-y:auto;}' +
        '#settings-sidebar.open{right:0;}' +
        '#settings-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}' +
        '#settings-header h2{margin:0;font-size:1.4rem;color:var(--text-dark);}' +
        '#settings-close{background:none;border:none;font-size:1.8rem;cursor:pointer;color:var(--text-light);padding:0 4px;}' +
        '#settings-close:hover{color:var(--text-dark);}' +
        '.settings-section{margin-bottom:20px;}' +
        '.settings-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-color);color:var(--text-dark);}' +
        '.toggle-switch{position:relative;display:inline-block;width:48px;height:26px;}' +
        '.toggle-switch input{opacity:0;width:0;height:0;}' +
        '.toggle-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--border-color);border-radius:26px;transition:0.3s;}' +
        '.toggle-slider:before{content:"";position:absolute;height:20px;width:20px;left:3px;bottom:3px;background:white;border-radius:50%;transition:0.3s;}' +
        '.toggle-switch input:checked+.toggle-slider{background:var(--primary-color);}' +
        '.toggle-switch input:checked+.toggle-slider:before{transform:translateX(22px);}' +
        '.settings-section-title{font-size:1rem;font-weight:600;color:var(--text-dark);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border-color);}' +
        '.settings-login-btn{display:block;width:100%;padding:10px;background:var(--primary-color);color:white;border:none;border-radius:8px;font-size:0.95rem;font-weight:600;cursor:pointer;transition:background 0.3s;text-align:center;text-decoration:none;box-sizing:border-box;}' +
        '.settings-login-btn:hover{background:var(--primary-dark);}';
    document.head.appendChild(style);
})();
