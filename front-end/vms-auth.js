// ── vms-auth.js ──────────────────────────────────────────────
// Shared authentication, routing, and UI helpers

const VMS = {
  users: [
    { id: 1, username: 'admin',   password: 'admin123',   name: 'Alex Morgan',   role: 'admin',   email: 'admin@vms.io'   },
    { id: 2, username: 'manager', password: 'manager123', name: 'Sarah Chen',    role: 'manager', email: 'schen@vms.io'   },
    { id: 3, username: 'vendor',  password: 'vendor123',  name: 'TechFlow Inc.', role: 'vendor',  email: 'vendor@vms.io'  },
    { id: 4, username: 'finance', password: 'finance123', name: 'Omar Hassan',   role: 'finance', email: 'ohassan@vms.io' },
  ],

  ROLE_PAGES: {
    admin: 'admin.html',
    vendor: 'vendor.html',
    manager: 'manager.html',
    finance: 'finance.html',
  },

  ROLE_LABELS: {
    admin: 'Admin',
    vendor: 'Vendor',
    manager: 'Manager',
    finance: 'Finance Officer',
  },

  DEMO_ACCOUNTS: {
    admin:   { username: 'admin',   password: 'admin123',   role: 'admin'   },
    vendor:  { username: 'vendor',  password: 'vendor123',  role: 'vendor'  },
    manager: { username: 'manager', password: 'manager123', role: 'manager' },
    finance: { username: 'finance', password: 'finance123', role: 'finance' },
  },

  login(username, password, role) {
    const user = this.users.find(
      u => u.username === username && u.password === password && u.role === role
    );
    if (user) {
      sessionStorage.setItem('vms_user', JSON.stringify(user));
      return user;
    }
    return null;
  },

  getHtmlBasePath() {
    let path = window.location.pathname.replace(/\\/g, '/');
    if (path.endsWith('.html')) {
      return path.substring(0, path.lastIndexOf('/') + 1);
    }
    if (!path.endsWith('/')) path += '/';
    return path;
  },

  goToPage(filename) {
    window.location.href = this.getHtmlBasePath() + filename;
  },

  logout() {
    sessionStorage.removeItem('vms_user');
    this.goToPage('index.html');
  },

  getUser() {
    try {
      const raw = sessionStorage.getItem('vms_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      sessionStorage.removeItem('vms_user');
      return null;
    }
  },

  requireAuth(expectedRole) {
    const user = this.getUser();
    if (!user) {
      this.goToPage('index.html');
      return null;
    }
    if (expectedRole && user.role !== expectedRole) {
      this.goToPage(this.ROLE_PAGES[user.role] || 'index.html');
      return null;
    }
    return user;
  },

  redirectIfAuthenticated() {
    const user = this.getUser();
    if (user && this.ROLE_PAGES[user.role]) {
      this.goToPage(this.ROLE_PAGES[user.role]);
      return true;
    }
    return false;
  },

  loginAndRedirect(username, password, role) {
    const user = this.login(username, password, role);
    if (!user) return false;
    this.goToPage(this.ROLE_PAGES[user.role]);
    return true;
  },

  demoLogin(role) {
    const demo = this.DEMO_ACCOUNTS[role];
    if (!demo) return false;
    return this.loginAndRedirect(demo.username, demo.password, demo.role);
  },

  getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  },

  renderSidebarUser(user) {
    const el = document.getElementById('sidebar-user-name');
    const el2 = document.getElementById('sidebar-user-role');
    const avatar = document.getElementById('sidebar-avatar');
    if (el) el.textContent = user.name;
    if (el2) el2.textContent = this.ROLE_LABELS[user.role] || user.role;
    if (avatar) avatar.textContent = this.getInitials(user.name);
  },

  setActiveNav(id) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },

  showPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  navigate(panel, navId, titles) {
    this.showPanel('panel-' + panel);
    this.setActiveNav(navId);
    const topbar = document.getElementById('topbar-title');
    if (topbar) {
      topbar.textContent = (titles && titles[panel]) || panel.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    if (window.innerWidth < 900) this.closeSidebar();
  },

  initLoginPage() {
    if (this.redirectIfAuthenticated()) return;

    let selectedRole = null;
    const errEl = document.getElementById('errorMsg');
    const usernameEl = document.getElementById('username');
    const passwordEl = document.getElementById('password');

    const showError = (message) => {
      if (!errEl) return;
      errEl.innerHTML = `<i class="bi bi-exclamation-circle"></i>&nbsp;${message}`;
      errEl.classList.add('show');
    };

    const hideError = () => {
      if (errEl) errEl.classList.remove('show');
    };

    const selectRole = (role) => {
      selectedRole = role;
      document.querySelectorAll('.role-btn').forEach(btn => {
        btn.className = 'role-btn';
        const isSelected = btn.dataset.role === role;
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        if (isSelected) btn.classList.add('selected-' + role);
      });
      hideError();
    };

    const fillDemo = (role) => {
      const demo = this.DEMO_ACCOUNTS[role];
      if (!demo) return;
      if (usernameEl) usernameEl.value = demo.username;
      if (passwordEl) passwordEl.value = demo.password;
      selectRole(role);
    };

    const doLogin = () => {
      const username = (usernameEl?.value || '').trim();
      const password = (passwordEl?.value || '').trim();

      if (!selectedRole) {
        showError('Please select a role first.');
        return;
      }
      if (!username || !password) {
        showError('Enter your username and password.');
        return;
      }

      if (!this.loginAndRedirect(username, password, selectedRole)) {
        showError('Invalid credentials or role mismatch.');
      }
    };

    window.selectRole = selectRole;
    window.fillDemo = fillDemo;
    window.doLogin = doLogin;
    window.togglePass = togglePass;

    const toggleBtn = document.getElementById('togglePassBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePass();
      });
    }

    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => selectRole(btn.dataset.role));
    });

    document.querySelectorAll('.demo-item').forEach(item => {
      item.addEventListener('click', () => {
        const role = item.dataset.role;
        if (role) fillDemo(role);
      });
      item.addEventListener('dblclick', () => {
        const role = item.dataset.role;
        if (role) this.demoLogin(role);
      });
    });

    document.querySelectorAll('.demo-item-login').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const role = item.dataset.role;
        if (role) this.demoLogin(role);
      });
    });

    const form = document.getElementById('loginForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        doLogin();
      });
    }

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        doLogin();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.querySelector('.login-page')) doLogin();
    });
  },

  initAppLayout() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.addEventListener('click', () => this.closeSidebar());
      document.body.appendChild(overlay);
    }

    const topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('sidebarToggle')) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.id = 'sidebarToggle';
      toggle.className = 'sidebar-toggle';
      toggle.setAttribute('aria-label', 'Open menu');
      toggle.innerHTML = '<i class="bi bi-list"></i>';
      toggle.addEventListener('click', () => this.toggleSidebar());
      topbar.insertBefore(toggle, topbar.firstChild);
    }

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
      });
    });
  },

  toggleSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('open');
    document.querySelector('.sidebar-overlay')?.classList.toggle('open');
  },

  closeSidebar() {
    document.querySelector('.sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('open');
  },
};

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function togglePass() {
  const p = document.getElementById('password');
  const icon = document.getElementById('eyeIcon');
  const btn = document.getElementById('togglePassBtn');
  if (!p || !icon) return;

  const show = p.type === 'password';
  p.type = show ? 'text' : 'password';
  icon.className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
  if (btn) {
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    btn.setAttribute('aria-pressed', show ? 'true' : 'false');
  }
}

function showToast(msg, type = 'success') {
  const colors = { success: '#2ecc7a', error: '#e85454', info: '#4f8ef7', warning: '#f5a623' };
  const t = document.createElement('div');
  t.className = 'vms-toast';
  t.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${colors[type] || colors.success};color:#fff;
    padding:12px 20px;border-radius:10px;font-size:13px;font-weight:500;
    font-family:'DM Sans',sans-serif;
    box-shadow:0 4px 20px rgba(0,0,0,.4);
    animation:vmsSlideIn .2s ease;
  `;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function bootLoginPage() {
  if (document.body.classList.contains('login-page')) {
    VMS.initLoginPage();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootLoginPage);
} else {
  bootLoginPage();
}
