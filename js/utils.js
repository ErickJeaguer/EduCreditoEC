/**
 * @fileoverview EduCrédito EC - Utilidades Globales
 * @module EduUtils
 * @description Funciones de utilidad compartidas para toda la aplicación.
 */

'use strict';

const EduUtils = (() => {

  // ─── Formateo ────────────────────────────────────────────────────────────────

  /**
   * Formatea un número como moneda en dólares (USD).
   * @param {number} amount - Cantidad a formatear.
   * @returns {string} Ej: '$20.00'
   */
  function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Formatea una fecha en formato DD/MM/YYYY.
   * @param {Date|string} date - Fecha a formatear.
   * @returns {string} Ej: '01/08/2026'
   */
  function formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  /**
   * Formatea una fecha en formato largo en español.
   * @param {Date|string} date - Fecha a formatear.
   * @returns {string} Ej: 'Martes, 01 de agosto de 2026'
   */
  function formatDateLong(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    }).replace(/^\w/, c => c.toUpperCase());
  }

  /**
   * Agrega días a una fecha y retorna la nueva fecha.
   * @param {Date|string} date - Fecha base.
   * @param {number} days - Días a agregar.
   * @returns {Date} Nueva fecha.
   */
  function addDays(date, days) {
    const d = date instanceof Date ? new Date(date) : new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Genera un ID único basado en timestamp y número aleatorio.
   * @returns {string} ID único.
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /**
   * Limita la frecuencia de ejecución de una función.
   * @param {Function} fn - Función a limitar.
   * @param {number} wait - Milisegundos de espera.
   * @returns {Function} Función con debounce aplicado.
   */
  function debounce(fn, wait) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // ─── Loader ──────────────────────────────────────────────────────────────────

  /**
   * Muestra el loader de página (.page-loader).
   */
  function showLoader() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
      loader.style.display = 'flex';
      loader.classList.remove('hidden');
    }
  }

  /**
   * Oculta el loader de página (.page-loader).
   */
  function hideLoader() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => { loader.style.display = 'none'; }, 400);
    }
  }

  // ─── Toast & Diálogos ────────────────────────────────────────────────────────

  /**
   * Muestra un toast de SweetAlert2 en la esquina superior derecha.
   * @param {string} message - Mensaje a mostrar.
   * @param {'success'|'error'|'warning'|'info'} [type='success'] - Tipo de alerta.
   */
  function showToast(message, type = 'success') {
    if (typeof Swal === 'undefined') {
      console.warn('[EduUtils] SweetAlert2 no disponible.');
      return;
    }
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });
    Toast.fire({ icon: type, title: message });
  }

  /**
   * Muestra un diálogo de confirmación con SweetAlert2.
   * @param {string} title - Título del diálogo.
   * @param {string} text - Texto del cuerpo del diálogo.
   * @param {string} [confirmText='Confirmar'] - Texto del botón de confirmación.
   * @returns {Promise<boolean>} Resuelve true si se confirma, false si se cancela.
   */
  async function confirmDialog(title, text, confirmText = 'Confirmar') {
    if (typeof Swal === 'undefined') return false;
    const result = await Swal.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    });
    return result.isConfirmed;
  }

  // ─── localStorage ─────────────────────────────────────────────────────────────

  /**
   * Obtiene y parsea un valor de localStorage.
   * @param {string} key - Clave de localStorage.
   * @returns {*} Valor parseado o null si no existe o hay error.
   */
  function getFromStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`[EduUtils] Error leyendo localStorage[${key}]:`, e);
      return null;
    }
  }

  /**
   * Serializa y guarda un valor en localStorage.
   * @param {string} key - Clave de localStorage.
   * @param {*} value - Valor a guardar.
   */
  function setToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[EduUtils] Error escribiendo localStorage[${key}]:`, e);
    }
  }

  /**
   * Elimina una clave de localStorage.
   * @param {string} key - Clave a eliminar.
   */
  function removeFromStorage(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[EduUtils] Error eliminando localStorage[${key}]:`, e);
    }
  }

  // ─── Sesión ──────────────────────────────────────────────────────────────────

  /**
   * Obtiene el usuario actual desde localStorage.
   * @returns {Object|null} Objeto de usuario o null.
   */
  function getCurrentUser() {
    return getFromStorage('educredito_user');
  }

  /**
   * Verifica si hay una sesión activa.
   * @returns {boolean} True si está logueado.
   */
  function isLoggedIn() {
    const session = getFromStorage('educredito_session');
    return !!(session && session.loggedIn === true);
  }

  /**
   * Obtiene el rol del usuario en sesión.
   * @returns {'student'|'admin'|null} Rol actual o null.
   */
  function getRole() {
    const session = getFromStorage('educredito_session');
    return session ? session.role : null;
  }

  /**
   * Verifica la sesión y redirige al login si no hay sesión activa.
   * Detecta automáticamente si estamos en una subcarpeta.
   */
  function checkSession() {
    if (!isLoggedIn()) {
      const isSubfolder = window.location.pathname.split('/').filter(Boolean).length > 1 ||
                          window.location.pathname.includes('\\admin\\') ||
                          window.location.pathname.includes('\\student\\') ||
                          window.location.pathname.includes('/admin/') ||
                          window.location.pathname.includes('/student/');
      const loginPath = isSubfolder ? '../login.html' : 'login.html';
      window.location.href = loginPath;
    }
  }

  /**
   * Verifica que el usuario tenga el rol esperado; redirige si no.
   * @param {'student'|'admin'} expectedRole - Rol esperado.
   */
  function checkRole(expectedRole) {
    checkSession();
    const role = getRole();
    if (role !== expectedRole) {
      if (role === 'admin') {
        window.location.href = '../admin/dashboard.html';
      } else if (role === 'student') {
        window.location.href = '../student/dashboard.html';
      } else {
        window.location.href = '../login.html';
      }
    }
  }

  // ─── Formato de estado ────────────────────────────────────────────────────────

  /**
   * Genera un badge HTML con color correspondiente al estado del préstamo.
   * @param {string} status - Estado ('Pendiente', 'Activo', 'Pagado', 'Rechazado', 'Vencido', 'En mora', 'Verificado').
   * @returns {string} HTML del badge.
   */
  function formatStatus(status) {
    const map = {
      'Pendiente':  { cls: 'warning',   icon: 'hourglass-split' },
      'Activo':     { cls: 'success',   icon: 'check-circle-fill' },
      'Pagado':     { cls: 'primary',   icon: 'check2-all' },
      'Rechazado':  { cls: 'danger',    icon: 'x-circle-fill' },
      'Vencido':    { cls: 'dark',      icon: 'exclamation-triangle-fill' },
      'En mora':    { cls: 'danger',    icon: 'exclamation-circle-fill' },
      'Verificado': { cls: 'info',      icon: 'shield-check' },
      'Cancelado':  { cls: 'secondary', icon: 'slash-circle' }
    };
    const def = { cls: 'secondary', icon: 'question-circle' };
    const { cls, icon } = map[status] || def;
    return `<span class="badge bg-${cls}"><i class="bi bi-${icon} me-1"></i>${escapeHtml(status)}</span>`;
  }

  /**
   * Escapa caracteres HTML especiales para prevenir XSS.
   * @param {string} str - Cadena a escapar.
   * @returns {string} Cadena escapada.
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── API pública ──────────────────────────────────────────────────────────────
  return Object.freeze({
    formatCurrency,
    formatDate,
    formatDateLong,
    addDays,
    generateId,
    debounce,
    showLoader,
    hideLoader,
    showToast,
    confirmDialog,
    getFromStorage,
    setToStorage,
    removeFromStorage,
    getCurrentUser,
    isLoggedIn,
    getRole,
    checkSession,
    checkRole,
    formatStatus,
    escapeHtml
  });
})();

window.EduUtils = EduUtils;
