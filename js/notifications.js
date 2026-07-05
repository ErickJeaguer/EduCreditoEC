/**
 * notifications.js – EduCrédito EC
 * Sistema de notificaciones vía localStorage
 */
'use strict';

window.EduNotifications = (() => {

  const KEY = 'educredito_notifications';

  const ICONS = {
    success: { icon: 'fa-circle-check',  color: '#10B981', bg: '#D1FAE5' },
    error:   { icon: 'fa-circle-xmark',  color: '#EF4444', bg: '#FEE2E2' },
    warning: { icon: 'fa-triangle-exclamation', color: '#F59E0B', bg: '#FEF3C7' },
    info:    { icon: 'fa-circle-info',   color: '#3B82F6', bg: '#DBEAFE' },
  };

  /** @returns {Array} Lista de notificaciones */
  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }

  /** @param {Array} list */
  function saveAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  /**
   * Agrega una nueva notificación.
   * @param {string} titulo
   * @param {string} mensaje
   * @param {'success'|'error'|'warning'|'info'} tipo
   */
  function agregar(titulo, mensaje, tipo = 'info') {
    const n = {
      id:     Date.now().toString(),
      titulo,
      mensaje,
      tipo,
      leida:  false,
      fecha:  new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    };
    const lista = getAll();
    lista.unshift(n);
    if (lista.length > 50) lista.length = 50;
    saveAll(lista);
    actualizarBadge();
    return n;
  }

  /**
   * Marca una notificación como leída.
   * @param {string} id
   */
  function marcarLeida(id) {
    const lista = getAll().map(n => n.id === id ? { ...n, leida: true } : n);
    saveAll(lista);
    actualizarBadge();
  }

  /** Marca todas como leídas. */
  function marcarTodasLeidas() {
    const lista = getAll().map(n => ({ ...n, leida: true }));
    saveAll(lista);
    actualizarBadge();
  }

  /**
   * Elimina una notificación por ID.
   * @param {string} id
   */
  function eliminar(id) {
    saveAll(getAll().filter(n => n.id !== id));
    actualizarBadge();
  }

  /** @returns {number} Cantidad de no leídas */
  function cantidadNoLeidas() {
    return getAll().filter(n => !n.leida).length;
  }

  /** Actualiza todos los badges de notificación en el DOM. */
  function actualizarBadge() {
    const count = cantidadNoLeidas();
    document.querySelectorAll('.notification-badge, .notif-count').forEach(el => {
      el.textContent = count > 9 ? '9+' : count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    // sidebar badge
    document.querySelectorAll('.sidebar-badge[data-for="notifications"]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  /**
   * Renderiza notificaciones en un contenedor HTML.
   * @param {string} containerId - ID del elemento contenedor
   * @param {'all'|string} [filtro='all'] - tipo para filtrar
   */
  function renderizar(containerId, filtro = 'all') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let lista = getAll();
    if (filtro !== 'all') lista = lista.filter(n => n.tipo === filtro);

    if (lista.length === 0) {
      container.innerHTML = `
        <div class="empty-state py-5">
          <i class="fa-regular fa-bell fa-3x mb-3" style="color:#D1D5DB"></i>
          <h5>Sin notificaciones</h5>
          <p class="text-muted small">No hay notificaciones que mostrar.</p>
        </div>`;
      return;
    }

    container.innerHTML = lista.map(n => {
      const meta = ICONS[n.tipo] || ICONS.info;
      return `
        <div class="notif-item ${n.leida ? 'leida' : 'no-leida'}" id="notif-${n.id}"
             style="display:flex;align-items:flex-start;gap:12px;padding:14px 18px;
                    border-bottom:1px solid #F3F4F6;cursor:pointer;
                    background:${n.leida ? '#fff' : '#F0F9FF'};
                    transition:background .2s;"
             onclick="EduNotifications.marcarLeida('${n.id}'); this.style.background='#fff';">
          <div style="width:38px;height:38px;border-radius:10px;background:${meta.bg};
                      display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i class="fa-solid ${meta.icon}" style="color:${meta.color};font-size:16px;"></i>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:${n.leida ? 500 : 700};color:#1F2937;
                        margin-bottom:2px;">${n.titulo}</div>
            <div style="font-size:12px;color:#6B7280;line-height:1.5;">${n.mensaje}</div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">
              <i class="fa-regular fa-clock me-1"></i>${n.fecha}
            </div>
          </div>
          ${!n.leida ? '<div style="width:8px;height:8px;border-radius:50%;background:#3B82F6;flex-shrink:0;margin-top:6px;"></div>' : ''}
          <button onclick="event.stopPropagation();EduNotifications.eliminar('${n.id}');
                           document.getElementById('notif-${n.id}').remove();"
                  style="background:none;border:none;color:#D1D5DB;cursor:pointer;padding:4px;
                         font-size:13px;flex-shrink:0;" title="Eliminar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>`;
    }).join('');
  }

  /**
   * Dropdown de notificaciones para el header.
   * @param {string} containerId
   */
  function renderDropdown(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const lista = getAll().slice(0, 6);
    const noLeidas = cantidadNoLeidas();

    if (lista.length === 0) {
      container.innerHTML = `<div class="p-3 text-center text-muted small">Sin notificaciones</div>`;
      return;
    }

    container.innerHTML = lista.map(n => {
      const meta = ICONS[n.tipo] || ICONS.info;
      return `
        <div class="dropdown-item py-2 px-3 ${n.leida ? '' : 'fw-semibold'}" 
             style="white-space:normal;font-size:12px;border-bottom:1px solid #F9FAFB;cursor:pointer;"
             onclick="EduNotifications.marcarLeida('${n.id}')">
          <div style="display:flex;gap:8px;align-items:flex-start;">
            <i class="fa-solid ${meta.icon} mt-1" style="color:${meta.color};font-size:13px;flex-shrink:0;"></i>
            <div>
              <div style="font-weight:${n.leida?500:700};color:#1F2937;">${n.titulo}</div>
              <div style="color:#6B7280;margin-top:1px;">${n.mensaje.substring(0,60)}${n.mensaje.length>60?'...':''}</div>
              <div style="color:#9CA3AF;font-size:10px;margin-top:2px;">${n.fecha}</div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // Inicializar datos demo si no hay notificaciones
  function initDemo() {
    if (getAll().length === 0) {
      agregar('Bienvenido a EduCrédito EC', 'Tu cuenta ha sido creada correctamente. Explora el panel.', 'success');
      agregar('Simulador disponible', 'Puedes simular un crédito antes de solicitarlo.', 'info');
    }
    actualizarBadge();
  }

  return {
    getAll, agregar, marcarLeida, marcarTodasLeidas, eliminar,
    cantidadNoLeidas, actualizarBadge, renderizar, renderDropdown, initDemo,
  };
})();
