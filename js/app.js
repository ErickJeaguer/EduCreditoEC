/**
 * @fileoverview EduCrédito EC - Inicialización Global de la Aplicación
 * @module app
 * @description Inicializa librerías, maneja sidebar, sesión y comportamiento global.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ─── AOS ─────────────────────────────────────────────────────────────────────

  /**
   * Inicializa la librería AOS (Animate On Scroll).
   */
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 700, once: true, offset: 60 });
  }

  // ─── Bootstrap Tooltips & Popovers ───────────────────────────────────────────

  /**
   * Inicializa todos los tooltips de Bootstrap presentes en el DOM.
   */
  const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltipEls.forEach(el => {
    new bootstrap.Tooltip(el, { trigger: 'hover' });
  });

  /**
   * Inicializa todos los popovers de Bootstrap presentes en el DOM.
   */
  const popoverEls = document.querySelectorAll('[data-bs-toggle="popover"]');
  popoverEls.forEach(el => new bootstrap.Popover(el));

  // ─── Sidebar Toggle ───────────────────────────────────────────────────────────

  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebarOverlay');
  const btnToggle = document.getElementById('sidebarToggle');

  /**
   * Abre el sidebar y muestra el overlay.
   */
  function openSidebar() {
    if (sidebar) sidebar.classList.add('show');
    if (overlay) overlay.classList.add('show');
    document.body.classList.add('sidebar-open');
  }

  /**
   * Cierra el sidebar y oculta el overlay.
   */
  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
    document.body.classList.remove('sidebar-open');
  }

  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      if (sidebar && sidebar.classList.contains('show')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Cerrar sidebar al presionar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  // ─── Link activo en sidebar ───────────────────────────────────────────────────

  /**
   * Marca como activo el enlace del sidebar que coincide con la URL actual.
   */
  (function setActiveSidebarLink() {
    const currentPath = window.location.pathname.split('/').pop() ||
                        window.location.pathname.split('\\').pop();
    const navLinks = document.querySelectorAll('.sidebar .nav-link, .sidebar-nav .nav-link');
    navLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').split('/').pop().split('\\').pop();
      if (href && href === currentPath) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
        // Expandir collapse padre si existe
        const collapse = link.closest('.collapse');
        if (collapse) {
          collapse.classList.add('show');
          const trigger = document.querySelector(`[data-bs-target="#${collapse.id}"]`);
          if (trigger) trigger.classList.remove('collapsed');
        }
      }
    });
  })();

  // ─── Expiración de sesión (30 min) ───────────────────────────────────────────

  /**
   * Revisa si la sesión ha expirado (30 minutos de inactividad).
   */
  (function checkSessionExpiry() {
    if (typeof EduUtils === 'undefined') return;
    const session = EduUtils.getFromStorage('educredito_session');
    if (!session || !session.loggedIn) return;

    const SESSION_MAX_MS = 30 * 60 * 1000; // 30 minutos
    const elapsed = Date.now() - (session.loginTime || 0);

    if (elapsed > SESSION_MAX_MS) {
      EduUtils.removeFromStorage('educredito_session');
      EduUtils.removeFromStorage('educredito_user');
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Sesión expirada',
          text: 'Tu sesión ha expirado por inactividad. Por favor inicia sesión nuevamente.',
          icon: 'warning',
          confirmButtonText: 'Ir al login',
          allowOutsideClick: false
        }).then(() => {
          const isSubfolder = window.location.pathname.includes('/admin/') ||
                              window.location.pathname.includes('/student/') ||
                              window.location.pathname.includes('\\admin\\') ||
                              window.location.pathname.includes('\\student\\');
          window.location.href = isSubfolder ? '../login.html' : 'login.html';
        });
      }
      return;
    }

    // Renovar loginTime en cada carga de página
    session.loginTime = Date.now();
    EduUtils.setToStorage('educredito_session', session);
  })();

  // ─── Badge de notificaciones ──────────────────────────────────────────────────

  /**
   * Actualiza los badges de notificaciones no leídas en el DOM.
   */
  (function updateNotificationBadge() {
    if (typeof EduUtils === 'undefined') return;
    const notifications = EduUtils.getFromStorage('educredito_notifications') || [];
    const unread = notifications.filter(n => !n.leida).length;
    const badges = document.querySelectorAll('.notification-badge');
    badges.forEach(badge => {
      if (unread > 0) {
        badge.textContent = unread > 99 ? '99+' : unread;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    });
  })();

  // ─── Smooth scroll ───────────────────────────────────────────────────────────

  /**
   * Aplica smooth scroll a todos los enlaces ancla internos (#).
   */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ─── Page Loader ─────────────────────────────────────────────────────────────

  /**
   * Oculta automáticamente el loader de página cuando todo el contenido cargó.
   */
  (function autoHideLoader() {
    const loader = document.querySelector('.page-loader');
    if (!loader) return;
    // Ya visible: ocultar tras breve delay para animación
    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => { loader.style.display = 'none'; }, 400);
      }, 300);
    });
    // Fallback: si window.load ya ocurrió
    if (document.readyState === 'complete') {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => { loader.style.display = 'none'; }, 400);
      }, 500);
    }
  })();

  // ─── Manejo global de errores ─────────────────────────────────────────────────

  /**
   * Captura errores globales y evita mostrarlos en crudo al usuario.
   */
  window.addEventListener('error', (event) => {
    console.error('[EduCrédito] Error no capturado:', event.error || event.message);
    // No mostrar errores técnicos al usuario final
    return true; // Previene el reporte por defecto del navegador en consola
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[EduCrédito] Promesa rechazada sin capturar:', event.reason);
    event.preventDefault();
  });

  // ─── Avatar en navbar ─────────────────────────────────────────────────────────

  /**
   * Muestra el avatar y nombre del usuario en la navbar si existe.
   */
  (function populateNavbarUser() {
    if (typeof EduUtils === 'undefined') return;
    const user = EduUtils.getCurrentUser();
    if (!user) return;

    const nameEl = document.getElementById('navUserName');
    if (nameEl) nameEl.textContent = user.nombre || 'Usuario';

    const avatarEl = document.getElementById('navUserAvatar');
    if (avatarEl && user.avatar) {
      avatarEl.src = user.avatar;
    }

    // Iniciales en avatar de texto
    const initialsEl = document.getElementById('navUserInitials');
    if (initialsEl) {
      const initials = ((user.nombre || '?')[0] + (user.apellido || '?')[0]).toUpperCase();
      initialsEl.textContent = initials;
    }
  })();

  // ─── Theme Toggle ─────────────────────────────────────────────────────────────

  (function initThemeToggle() {
    // Aplicar tema guardado
    const savedTheme = localStorage.getItem('educredito_theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const topbarRight = document.querySelector('.topbar-right');
    let toggleBtn;

    if (topbarRight) {
      // Estamos en la plataforma (dashboard)
      toggleBtn = document.createElement('button');
      toggleBtn.className = 'topbar-bell'; // Reusar estilo de la campanita
      toggleBtn.id = 'themeToggleBtn';
      toggleBtn.setAttribute('title', 'Alternar modo oscuro');
      
      // Añadir como primer elemento en topbar-right para evitar errores de anidamiento
      topbarRight.prepend(toggleBtn);
    } else {
      // Estamos en landing, login o register (flotante)
      toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn-fab';
      toggleBtn.id = 'themeToggleBtn';
      toggleBtn.style.bottom = '20px';
      toggleBtn.style.left = '20px'; // Lado izquierdo para no tapar boton flotante de top
      toggleBtn.style.right = 'auto';
      toggleBtn.style.width = '3rem';
      toggleBtn.style.height = '3rem';
      toggleBtn.setAttribute('title', 'Alternar modo oscuro');
      document.body.appendChild(toggleBtn);
    }

    const updateIcon = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      toggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    };
    updateIcon();

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('educredito_theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('educredito_theme', 'dark');
      }
      updateIcon();
    });
  })();

  // ─── Botón de logout ──────────────────────────────────────────────────────────

  /**
   * Maneja el botón de cerrar sesión.
   */
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (typeof EduUtils === 'undefined') return;
      const confirmed = await EduUtils.confirmDialog(
        '¿Cerrar sesión?',
        '¿Estás seguro de que deseas cerrar tu sesión?',
        'Cerrar sesión'
      );
      if (confirmed) {
        EduUtils.removeFromStorage('educredito_session');
        EduUtils.removeFromStorage('educredito_user');
        const isSubfolder = window.location.pathname.includes('/admin/') ||
                            window.location.pathname.includes('/student/') ||
                            window.location.pathname.includes('\\admin\\') ||
                            window.location.pathname.includes('\\student\\');
        window.location.href = isSubfolder ? '../login.html' : 'login.html';
      }
    });
  }

});
