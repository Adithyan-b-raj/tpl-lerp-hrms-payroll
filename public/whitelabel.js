/**
 * BMAD White-Label URL Personalizer Engine (whitelabel.js)
 * Enterprise HRMS, Geo-Attendance, Leave & Payroll Suite
 *
 * Supports: ?brand=&tagline=&primary=&dark=&bg=&wa=&logo=&reset_wl=1
 * Persists across Customer (/) and Admin (/admin.html) views via sessionStorage + link propagation.
 */
(function () {
  var STORAGE_KEY = 'bmad_wl_config_v1';
  var DEFAULT_BRAND = 'Pulse HRMS';
  var DEFAULT_PRIMARY = '#4f46e5';
  var DEFAULT_WA = '919847011001';

  function sanitizeHex(val) {
    if (!val) return '';
    var clean = String(val).trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) {
      return '#' + clean;
    }
    return '';
  }

  function sanitizePhone(val) {
    if (!val) return '';
    return String(val).replace(/[^0-9]/g, '');
  }

  function loadConfig() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('reset_wl') === '1') {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
      return {};
    }

    var stored = {};
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) stored = JSON.parse(raw) || {};
    } catch (e) {}

    var updated = Object.assign({}, stored);
    if (params.has('brand')) updated.brand = params.get('brand').trim();
    if (params.has('tagline')) updated.tagline = params.get('tagline').trim();
    if (params.has('primary')) updated.primary = sanitizeHex(params.get('primary'));
    if (params.has('dark')) updated.dark = sanitizeHex(params.get('dark'));
    if (params.has('bg')) updated.bg = sanitizeHex(params.get('bg'));
    if (params.has('wa')) updated.wa = sanitizePhone(params.get('wa'));
    if (params.has('logo')) updated.logo = params.get('logo').trim();

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}

    return updated;
  }

  var config = loadConfig();
  window.__WL_CONFIG = config;

  function applyCssVariables(cfg) {
    var root = document.documentElement;
    if (!root) return;
    if (cfg.primary) {
      root.style.setProperty('--color-primary', cfg.primary);
      root.style.setProperty('--brand-primary', cfg.primary);
    }
    if (cfg.dark) {
      root.style.setProperty('--color-dark', cfg.dark);
      root.style.setProperty('--brand-dark', cfg.dark);
    }
    if (cfg.bg) {
      root.style.setProperty('--bg-main', cfg.bg);
      root.style.setProperty('--bg-canvas', cfg.bg);
      root.style.setProperty('--bg-sand', cfg.bg);
    }
  }

  function renderSplitBrand(el, brandText, fallbackSub) {
    while (el.firstChild) el.removeChild(el.firstChild);
    var parts = brandText.split(/\s+/);
    var mainPart = parts[0] || brandText;
    var subPart = parts.length > 1 ? parts.slice(1).join(' ') : (fallbackSub || 'HRMS');
    el.appendChild(document.createTextNode(mainPart + ' '));
    var span = document.createElement('span');
    span.textContent = subPart;
    el.appendChild(span);
  }

  function applyDomOverrides() {
    var cfg = window.__WL_CONFIG || {};
    applyCssVariables(cfg);

    var activeBrand = cfg.brand || DEFAULT_BRAND;

    // Apply Logo / Brand element overrides
    if (cfg.brand || (cfg.logo && /^https?:\/\//i.test(cfg.logo))) {
      document.querySelectorAll('.brand-logo').forEach(function (el) {
        if (cfg.logo && /^https?:\/\//i.test(cfg.logo)) {
          while (el.firstChild) el.removeChild(el.firstChild);
          var img = document.createElement('img');
          img.src = cfg.logo;
          img.alt = activeBrand;
          img.style.maxHeight = '32px';
          img.style.width = 'auto';
          img.style.display = 'block';
          el.appendChild(img);
        } else {
          renderSplitBrand(el, activeBrand, 'People-Ops');
        }
      });
    }

    if (cfg.brand) {
      var isAdmin = window.location.pathname.indexOf('admin') !== -1;
      document.title = cfg.brand + (isAdmin ? ' — People-Ops & Payroll Console' : ' — Employee Self-Service & Attendance');

      document.querySelectorAll('.sidebar-brand-title').forEach(function (el) {
        renderSplitBrand(el, cfg.brand, 'Ops');
      });

      document.querySelectorAll('.mobile-brand').forEach(function (el) {
        renderSplitBrand(el, cfg.brand, 'Ops');
      });

      document.querySelectorAll('[data-wl-brand]').forEach(function (el) {
        el.textContent = cfg.brand;
      });
    }

    if (cfg.tagline) {
      document.querySelectorAll('[data-wl-tagline]').forEach(function (el) {
        el.textContent = cfg.tagline;
      });
    }

    // WhatsApp Integration
    var activeWa = cfg.wa || DEFAULT_WA;
    var waBtn = document.getElementById('floatingWaBtn');
    if (waBtn) {
      waBtn.href = 'https://wa.me/' + activeWa + '?text=' + encodeURIComponent('Hello HR Desk at ' + activeBrand + ', I have an inquiry regarding attendance or payslips.');
    }
    var drawerWa = document.getElementById('drawerWaText');
    if (drawerWa) {
      var formatted = activeWa.length === 12
        ? '+' + activeWa.slice(0, 2) + ' ' + activeWa.slice(2, 7) + ' ' + activeWa.slice(7)
        : '+' + activeWa;
      drawerWa.textContent = 'HR Desk WhatsApp: ' + formatted;
    }
    document.querySelectorAll('#adminWaInput, input[data-wl-wa]').forEach(function (inp) {
      inp.value = activeWa;
    });

    // Color pickers sync
    document.querySelectorAll('#adminPrimaryInput').forEach(function (inp) {
      if (cfg.primary) inp.value = cfg.primary;
    });
    document.querySelectorAll('#adminBrandInput').forEach(function (inp) {
      if (cfg.brand) inp.value = cfg.brand;
    });

    // Propagate query params across internal links (index.html <-> admin.html)
    var qs = new URLSearchParams();
    ['brand', 'tagline', 'primary', 'dark', 'bg', 'wa', 'logo'].forEach(function (k) {
      if (cfg[k]) qs.set(k, cfg[k]);
    });
    var qsStr = qs.toString();
    if (qsStr) {
      document.querySelectorAll('a[href^="admin.html"], a[href^="index.html"]').forEach(function (a) {
        var base = a.getAttribute('href').split('?')[0];
        a.setAttribute('href', base + '?' + qsStr);
      });
    }
  }

  window.applyWhiteLabel = applyDomOverrides;

  // Apply CSS variables immediately before body paint
  applyCssVariables(config);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDomOverrides);
  } else {
    applyDomOverrides();
  }
  window.addEventListener('load', applyDomOverrides);
  setTimeout(applyDomOverrides, 500);
})();
