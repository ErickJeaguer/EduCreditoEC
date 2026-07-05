/**
 * admin.js – EduCrédito EC
 * Lógica del panel administrativo con API SheetDB.
 */
'use strict';

window.EduAdmin = (() => {
  let cacheStudents = [];
  let cacheLoans = [];
  let cachePayments = [];

  /* ─── Carga Inicial ─────────────────────────────────────────── */
  async function loadData() {
    try {
      cacheStudents = await EduAPI.get('Usuarios') || [];
      cacheLoans = await EduAPI.get('Prestamos') || [];
      cachePayments = await EduAPI.get('Pagos') || [];
      
      // Reverse to show newest first
      cacheLoans.reverse();
      cachePayments.reverse();
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
  }

  /* ─── Getters ───────────────────────────────────────────────── */
  const getStudents = () => cacheStudents;
  const getLoans    = () => cacheLoans;
  const getPayments = () => cachePayments;

  /* ─── Helpers ───────────────────────────────────────────────── */
  const badgeHtml = {
    Pendiente: '<span class="badge-status badge-pendiente">Pendiente</span>',
    Activo:    '<span class="badge-status badge-activo">Activo</span>',
    Pagado:    '<span class="badge-status badge-pagado">Pagado</span>',
    Vencido:   '<span class="badge-status badge-vencido">Vencido</span>',
    Rechazado: '<span class="badge-status badge-rechazado">Rechazado</span>',
    Verificado:'<span class="badge-status badge-verificado">Verificado</span>',
    'En mora': '<span class="badge-status badge-mora">En mora</span>',
    Cancelado: '<span class="badge-status badge-cancelado">Cancelado</span>',
  };

  function getStudentName(id) {
    const s = cacheStudents.find(x => x.id === id);
    return s ? `${s.nombre} ${s.apellido}` : 'Desconocido';
  }

  /* ─── Renderizar tablas ─────────────────────────────────────── */
  async function renderTablaEstudiantes(containerId, filtro = '') {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>';
    if (cacheStudents.length === 0) await loadData();
    
    let lista = getStudents();
    if (filtro) lista = lista.filter(s =>
      (s.nombre + ' ' + s.apellido + ' ' + s.email + ' ' + s.facultad).toLowerCase().includes(filtro.toLowerCase())
    );
    if (lista.length === 0) { cont.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Sin resultados</td></tr>'; return; }
    cont.innerHTML = lista.map(s => `
      <tr>
        <td>
          <div class="table-user-cell">
            <div class="table-user-avatar" style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0F8B6D,#2563EB);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">
              ${(s.nombre?.[0]||'')}${(s.apellido?.[0]||'')}
            </div>
            <div>
              <div class="table-user-name">${s.nombre} ${s.apellido}</div>
              <div class="table-user-email">${s.email}</div>
            </div>
          </div>
        </td>
        <td>${s.cedula}</td>
        <td><span class="badge-status badge-aprobado">${s.facultad || 'N/A'}</span></td>
        <td>${s.carrera || 'N/A'}</td>
        <td><span class="badge-status ${s.estado==='Activo'?'badge-activo':'badge-cancelado'}">${s.estado || 'Activo'}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn action-btn-view" title="Ver detalle"><i class="fa-solid fa-eye"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  async function renderTablaSolicitudes(containerId, filtro = '') {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>';
    if (cacheLoans.length === 0) await loadData();

    let lista = getLoans().filter(l => l.estado === 'Pendiente');
    if (filtro) lista = lista.filter(l => getStudentName(l.id_estudiante).toLowerCase().includes(filtro.toLowerCase()));
    if (lista.length === 0) { cont.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No hay solicitudes pendientes</td></tr>'; return; }
    cont.innerHTML = lista.map(l => `
      <tr>
        <td><span class="font-mono text-muted" style="font-size:12px;">#${l.id.toUpperCase()}</span></td>
        <td><strong>${getStudentName(l.id_estudiante)}</strong></td>
        <td style="color:#0F8B6D;font-weight:700;">$${parseFloat(l.monto).toFixed(2)}</td>
        <td>${l.plazo} días</td>
        <td style="color:#6B7280;">$${parseFloat(l.total).toFixed(2)}</td>
        <td>${badgeHtml[l.estado] || l.estado}</td>
        <td>
          ${l.enlace_certificado ? `<a href="${l.enlace_certificado}" target="_blank" class="btn btn-sm btn-outline-secondary" style="font-size:11px;"><i class="fa-solid fa-file-pdf text-danger"></i> Ver Notas</a>` : '<span class="text-muted small">N/A</span>'}
        </td>
        <td>
          <div class="table-actions">
            <button class="action-btn action-btn-approve" title="Aprobar" onclick="EduAdmin.aprobarSolicitud('${l.id}')"><i class="fa-solid fa-check"></i></button>
            <button class="action-btn action-btn-reject"  title="Rechazar" onclick="EduAdmin.rechazarSolicitud('${l.id}')"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  async function renderTablaPrestamos(containerId, estadoFiltro = '') {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '<tr><td colspan="7" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>';
    if (cacheLoans.length === 0) await loadData();

    let lista = getLoans();
    if (estadoFiltro) lista = lista.filter(l => l.estado === estadoFiltro);
    if (lista.length === 0) { cont.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Sin préstamos</td></tr>'; return; }
    cont.innerHTML = lista.map(l => `
      <tr>
        <td><span class="font-mono text-muted" style="font-size:12px;">#${l.id.toUpperCase()}</span></td>
        <td><strong>${getStudentName(l.id_estudiante)}</strong></td>
        <td style="color:#0F8B6D;font-weight:700;">$${parseFloat(l.monto).toFixed(2)}</td>
        <td>$${parseFloat(l.total).toFixed(2)}</td>
        <td>${l.fecha_vencimiento || 'N/A'}</td>
        <td>${badgeHtml[l.estado] || l.estado}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn action-btn-view" title="Ver"><i class="fa-solid fa-eye"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  async function renderTablaPagos(containerId) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '<tr><td colspan="8" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>';
    if (cachePayments.length === 0) await loadData();

    const lista = getPayments();
    if (lista.length === 0) { cont.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Sin pagos registrados</td></tr>'; return; }
    cont.innerHTML = lista.map(p => `
      <tr>
        <td><span class="font-mono text-muted" style="font-size:12px;">#${p.id.toUpperCase()}</span></td>
        <td><strong>${getStudentName(p.id_estudiante)}</strong></td>
        <td style="color:#0F8B6D;font-weight:700;">$${parseFloat(p.monto).toFixed(2)}</td>
        <td>${p.fecha_pago}</td>
        <td>${p.metodo}</td>
        <td>${badgeHtml[p.estado] || p.estado}</td>
        <td>
          ${p.enlace_comprobante ? `<a href="${p.enlace_comprobante}" target="_blank" class="btn btn-sm btn-outline-secondary" style="font-size:11px;"><i class="fa-solid fa-image text-success"></i> Ver Comp.</a>` : '<span class="text-muted small">N/A</span>'}
        </td>
        <td>
          <div class="table-actions">
            ${p.estado === 'Pendiente' ? `
              <button class="action-btn action-btn-approve" title="Verificar" onclick="EduAdmin.verificarPago('${p.id}')"><i class="fa-solid fa-check"></i></button>
              <button class="action-btn action-btn-reject"  title="Rechazar"  onclick="EduAdmin.rechazarPago('${p.id}')"><i class="fa-solid fa-xmark"></i></button>
            ` : '<span class="text-muted" style="font-size:12px;">Procesado</span>'}
          </div>
        </td>
      </tr>`).join('');
  }

  /* ─── Acciones ──────────────────────────────────────────────── */
  async function aprobarSolicitud(id) {
    const ok = await Swal.fire({
      title: '¿Aprobar solicitud?',
      text: 'El préstamo quedará activo y el estudiante será notificado.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0F8B6D',
      cancelButtonColor: '#E5E7EB',
      borderRadius: '16px',
    });
    if (!ok.isConfirmed) return;

    Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const l = cacheLoans.find(x => x.id === id);
    const hoy = new Date();
    const vence = new Date(hoy.getTime() + (l.plazo||15)*86400000);
    const fmt = d => d.toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' });

    const update = { estado: 'Activo', fecha_aprobacion: fmt(hoy), fecha_vencimiento: fmt(vence) };
    await EduAPI.patch('Prestamos', id, update);
    Object.assign(l, update);

    Swal.fire({ title: '¡Aprobado!', text: 'El préstamo ha sido activado.', icon: 'success', confirmButtonColor: '#0F8B6D', borderRadius: '16px' });
    renderTablaSolicitudes('tbodySolicitudes');
    renderTablaPrestamos('tbodyPrestamosActivos', 'Activo');
  }

  async function rechazarSolicitud(id) {
    const { value: motivo } = await Swal.fire({
      title: 'Rechazar solicitud',
      input: 'textarea',
      inputLabel: 'Motivo de rechazo',
      inputPlaceholder: 'Escribe el motivo del rechazo...',
      inputAttributes: { rows: 3 },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#E5E7EB',
      inputValidator: v => !v.trim() ? 'El motivo es obligatorio' : null,
    });
    if (!motivo) return;

    Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    await EduAPI.patch('Prestamos', id, { estado: 'Rechazado', motivo_rechazo: motivo });
    const l = cacheLoans.find(x => x.id === id);
    if(l) { l.estado = 'Rechazado'; l.motivo_rechazo = motivo; }

    Swal.fire({ title: 'Rechazado', icon: 'info', confirmButtonColor: '#EF4444' });
    renderTablaSolicitudes('tbodySolicitudes');
  }

  async function verificarPago(id) {
    const ok = await Swal.fire({
      title: '¿Verificar pago?', text: 'Confirmas que el comprobante es válido.',
      icon: 'question', showCancelButton: true,
      confirmButtonText: 'Verificar', cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10B981',
    });
    if (!ok.isConfirmed) return;

    Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    await EduAPI.patch('Pagos', id, { estado: 'Verificado' });
    const p = cachePayments.find(x => x.id === id);
    if(p) p.estado = 'Verificado';

    // Opcional: Actualizar el estado del préstamo a Pagado si el saldo llega a 0 (omitido para mantener simpleza de BD, pero idealmente se haría)

    Swal.fire({ title: '¡Verificado!', icon: 'success', confirmButtonColor: '#10B981' });
    renderTablaPagos('tbodyPagos');
  }

  async function rechazarPago(id) {
    const { value: motivo } = await Swal.fire({
      title: 'Rechazar pago', input: 'text', inputLabel: 'Motivo',
      showCancelButton: true, confirmButtonText: 'Rechazar', confirmButtonColor: '#EF4444',
      inputValidator: v => !v.trim() ? 'Escribe un motivo' : null,
    });
    if (!motivo) return;

    Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    await EduAPI.patch('Pagos', id, { estado: 'Rechazado', motivo });
    const p = cachePayments.find(x => x.id === id);
    if(p) { p.estado = 'Rechazado'; p.motivo = motivo; }

    Swal.fire({ title: 'Rechazado', icon: 'info', confirmButtonColor: '#EF4444' });
    renderTablaPagos('tbodyPagos');
  }

  /* ─── Dashboard Stats ───────────────────────────────────────── */
  async function renderStats() {
    if (cacheLoans.length === 0) await loadData();
    const students = cacheStudents;
    const loans = cacheLoans;
    const payments = cachePayments;
    
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setEl('statEstudiantes', students.length);
    setEl('statPrestamos', loans.filter(l => l.estado === 'Activo').length);
    setEl('statVencidos', loans.filter(l => l.estado === 'Vencido').length);
    setEl('statMonto', '$' + loans.reduce((s, l) => s + (parseFloat(l.monto) || 0), 0).toFixed(2));
  }

  /* ─── Exportar CSV ──────────────────────────────────────────── */
  function exportarCSV() {
    const loans = getLoans();
    const header = 'ID,Estudiante,Monto,Plazo,Interés,Total,Estado,Fecha Solicitud,Fecha Vencimiento';
    const rows   = loans.map(l =>
      `${l.id},${getStudentName(l.id_estudiante)},$${l.monto},${l.plazo} días,$${l.interes},$${l.total},${l.estado},${l.fecha_solicitud},${l.fecha_vencimiento || ''}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `educredito_reporte_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    loadData, getStudents, getLoans, getPayments, renderStats,
    renderTablaEstudiantes, renderTablaSolicitudes, renderTablaPrestamos, renderTablaPagos,
    aprobarSolicitud, rechazarSolicitud, verificarPago, rechazarPago,
    exportarCSV,
  };
})();
