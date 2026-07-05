/**
 * dashboard.js – EduCrédito EC
 * Lógica del panel del estudiante
 */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof EduUtils !== 'undefined') EduUtils.checkSession();

  const user = EduUtils.getFromStorage('educredito_user') || {};
  
  // Buscar préstamos y pagos en SheetDB
  let loans = await EduAPI.get('Prestamos', { id_estudiante: user.id });
  let payments = await EduAPI.get('Pagos', { id_estudiante: user.id });

  // Asegurarnos de que sean arreglos
  if (!Array.isArray(loans)) loans = [];
  if (!Array.isArray(payments)) payments = [];

  // Bienvenida
  const welEl = document.getElementById('welcomeName');
  if (welEl) welEl.textContent = user.nombre || 'Estudiante';

  // KPI Cards
  const activeLoan = loans.find(l => ['Activo','Pendiente','Vencido','En mora'].includes(l.estado));
  const paidLoans  = loans.filter(l => l.estado === 'Pagado').length;

  const setStat = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setStat('statSaldo',    activeLoan ? `$${parseFloat(activeLoan.saldo || activeLoan.total || 0).toFixed(2)}` : '$0.00');
  setStat('statProximo',  activeLoan?.fechaVencimiento || 'Sin vencimiento');
  setStat('statActivos',  activeLoan ? '1' : '0');
  setStat('statHistorial', paidLoans.toString());

  // Alerta de mora/vencido
  if (activeLoan && (activeLoan.estado === 'Vencido' || activeLoan.estado === 'En mora')) {
    const alertEl = document.getElementById('overdueAlert');
    if (alertEl) alertEl.style.display = 'flex';
  }

  // Actividad reciente
  const actContainer = document.getElementById('recentActivity');
  if (actContainer) {
    const items = [
      ...loans.map(l => ({ tipo: 'prestamo', fecha: l.fechaSolicitud, desc: `Solicitud de crédito por $${parseFloat(l.monto).toFixed(2)}`, estado: l.estado, icon: 'fa-hand-holding-dollar', color: '#2563EB', bg: '#DBEAFE' })),
      ...payments.map(p => ({ tipo: 'pago', fecha: p.fecha, desc: `Pago de $${parseFloat(p.monto).toFixed(2)}`, estado: p.estado, icon: 'fa-money-bill-wave', color: '#10B981', bg: '#D1FAE5' })),
    ].sort((a,b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);

    if (items.length === 0) {
      actContainer.innerHTML = `<div class="empty-state py-4"><i class="fa-regular fa-clock fa-2x mb-2" style="color:#D1D5DB;"></i><p class="text-muted small mb-0">Sin actividad reciente</p></div>`;
    } else {
      actContainer.innerHTML = items.map(it => `
        <div class="activity-item" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #F9FAFB;">
          <div style="width:38px;height:38px;border-radius:10px;background:${it.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <i class="fa-solid ${it.icon}" style="color:${it.color};font-size:15px;"></i>
          </div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:600;color:#1F2937;">${it.desc}</div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:2px;"><i class="fa-regular fa-calendar me-1"></i>${it.fecha}</div>
          </div>
          <div>${it.estado ? `<span class="badge-status badge-${it.estado.toLowerCase().replace(' ','-')}">${it.estado}</span>` : ''}</div>
        </div>`).join('');
    }
  }

  // Próximo pago info
  const nextPayEl = document.getElementById('nextPaymentInfo');
  if (nextPayEl && activeLoan) {
    nextPayEl.innerHTML = `
      <div class="d-flex align-items-center gap-3 p-3" style="background:#F0FDF4;border-radius:12px;border:1px solid #BBF7D0;">
        <i class="fa-solid fa-calendar-check" style="color:#10B981;font-size:24px;"></i>
        <div>
          <div style="font-size:12px;color:#6B7280;">Próximo pago</div>
          <div style="font-size:18px;font-weight:700;color:#0F8B6D;">$${parseFloat(activeLoan.saldo||activeLoan.total||0).toFixed(2)}</div>
          <div style="font-size:11px;color:#6B7280;">Vence: ${activeLoan.fechaVencimiento}</div>
        </div>
      </div>`;
  }

  // Mini chart
  const chartEl = document.getElementById('miniChart');
  if (chartEl && typeof Chart !== 'undefined') {
    const meses = ['Feb','Mar','Abr','May','Jun','Jul'];
    const data  = [0, 15, 0, 20, 25, payments.reduce((s,p)=>s+parseFloat(p.monto||0),0) || 10];
    new Chart(chartEl, {
      type: 'line',
      data: {
        labels: meses,
        datasets: [{
          label: 'Pagos ($)', data,
          borderColor: '#0F8B6D', backgroundColor: 'rgba(15,139,109,.1)',
          fill: true, tension: 0.4, pointRadius: 4,
          pointBackgroundColor: '#0F8B6D',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,.04)' }, ticks: { font: { family: 'Poppins', size: 11 } } },
          x: { grid: { display: false }, ticks: { font: { family: 'Poppins', size: 11 } } },
        },
      },
    });
  }

  // Notificaciones
  if (typeof EduNotifications !== 'undefined') {
    EduNotifications.initDemo();
    EduNotifications.actualizarBadge();
  }

  // Botón solicitar oculto si hay préstamo activo
  const btnSolicitar = document.getElementById('btnSolicitarNuevo');
  if (btnSolicitar && activeLoan && activeLoan.estado === 'Activo') {
    btnSolicitar.disabled = true;
    btnSolicitar.title = 'Tiene un préstamo activo';
    btnSolicitar.innerHTML = '<i class="fa-solid fa-lock me-2"></i>Préstamo activo';
  }
});

/**
 * Cierra sesión del estudiante.
 */
function cerrarSesion() {
  Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Serás redirigido a la página de inicio.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Cerrar sesión',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#E5E7EB',
  }).then(r => {
    if (r.isConfirmed) {
      localStorage.removeItem('educredito_session');
      window.location.href = '../login.html';
    }
  });
}
