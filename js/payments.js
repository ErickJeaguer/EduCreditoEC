/**
 * payments.js – EduCrédito EC
 * Gestión de pagos y carga de comprobantes
 */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof EduUtils !== 'undefined') EduUtils.checkSession();
  
  // Show loading state initially
  const loanContainer = document.getElementById('loanInfoCard');
  if (loanContainer) loanContainer.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando información...</div>';
  const histContainer = document.getElementById('paymentsHistoryBody');
  if (histContainer) histContainer.innerHTML = '<tr><td colspan="5" class="text-center py-4"><i class="fa-solid fa-spinner fa-spin me-2"></i>Cargando historial...</td></tr>';
  
  const user = EduUtils.getFromStorage('educredito_user') || {};
  const loans = await EduAPI.get('Prestamos', { id_estudiante: user.id });
  const payments = await EduAPI.get('Pagos', { id_estudiante: user.id });
  
  cargarInfoPrestamo(loans || []);
  cargarHistorialPagos(payments || []);
  initFileUpload();
});

function cargarInfoPrestamo(loans) {
  const loan  = loans.find(l => l.estado === 'Activo');
  const container = document.getElementById('loanInfoCard');
  if (!container) return;

  if (!loan) {
    container.innerHTML = `
      <div class="empty-state py-4">
        <i class="fa-solid fa-circle-check fa-3x mb-3" style="color:#10B981;"></i>
        <h5>Sin préstamos activos</h5>
        <p class="text-muted small">No tienes ningún préstamo que requiera pago en este momento.</p>
        <a href="loan-request.html" class="btn btn-primary-custom btn-sm mt-2">Solicitar crédito</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="row g-3 align-items-center">
      <div class="col-md-8">
        <div class="d-flex flex-wrap gap-4">
          <div>
            <div style="font-size:11px;color:#6B7280;font-weight:500;text-transform:uppercase;letter-spacing:.04em;">Préstamo</div>
            <div style="font-size:22px;font-weight:800;color:#0F8B6D;">$${parseFloat(loan.total).toFixed(2)}</div>
            <div style="font-size:12px;color:#9CA3AF;">${loan.plazo} días · ${loan.tasa}% interés</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B7280;font-weight:500;text-transform:uppercase;letter-spacing:.04em;">Saldo pendiente</div>
            <div style="font-size:22px;font-weight:800;color:#EF4444;">$${parseFloat(loan.saldo||loan.total).toFixed(2)}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#6B7280;font-weight:500;text-transform:uppercase;letter-spacing:.04em;">Vence el</div>
            <div style="font-size:16px;font-weight:700;color:#F59E0B;">${loan.fechaVencimiento}</div>
          </div>
        </div>
      </div>
      <div class="col-md-4 text-md-end">
        <span class="badge-status badge-activo">Activo</span>
      </div>
    </div>`;

  // Guardar loanId en form hidden
  const hiddenLoan = document.getElementById('hiddenLoanId');
  if (hiddenLoan) hiddenLoan.value = loan.id;
}

function cargarHistorialPagos(payments) {
  const container = document.getElementById('paymentsHistoryBody');
  if (!container) return;

  if (payments.length === 0) {
    container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Sin pagos registrados</td></tr>';
    return;
  }

  const badges = {
    Pendiente:  '<span class="badge-status badge-pendiente">Pendiente</span>',
    Verificado: '<span class="badge-status badge-verificado">Verificado</span>',
    Rechazado:  '<span class="badge-status badge-rechazado">Rechazado</span>',
  };

  container.innerHTML = payments.map(p => `
    <tr>
      <td>${p.fecha_pago || p.fecha}</td>
      <td style="font-weight:700;color:#0F8B6D;">$${parseFloat(p.monto).toFixed(2)}</td>
      <td>${p.metodo}</td>
      <td>${p.referencia}</td>
      <td>${badges[p.estado] || p.estado}</td>
    </tr>`).join('');
}

let uploadedFile = null;

function initFileUpload() {
  const dropzone  = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover',  e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files.length) handleFile(fileInput.files[0]); });
}

function handleFile(file) {
  const ALLOWED = ['application/pdf','image/png','image/jpeg','image/jpg'];
  const MAX_MB  = 5;

  if (!ALLOWED.includes(file.type)) {
    Swal.fire({ title: 'Formato no permitido', text: 'Solo se aceptan archivos PDF, PNG, JPG o JPEG.', icon: 'error', confirmButtonColor: '#EF4444' });
    return;
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    Swal.fire({ title: 'Archivo muy grande', text: `El archivo no puede superar los ${MAX_MB} MB.`, icon: 'error', confirmButtonColor: '#EF4444' });
    return;
  }

  uploadedFile = file;
  const preview = document.getElementById('filePreview');
  const dropzone = document.getElementById('dropzone');
  if (preview) {
    const isImage = file.type.startsWith('image/');
    preview.style.display = 'flex';
    preview.innerHTML = `
      <div class="d-flex align-items-center gap-3 p-3" style="background:#F0FDF4;border-radius:10px;border:1px solid #BBF7D0;">
        <i class="fa-solid ${isImage?'fa-image':'fa-file-pdf'}" style="font-size:28px;color:${isImage?'#10B981':'#EF4444'};"></i>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:600;color:#1F2937;">${file.name}</div>
          <div style="font-size:11px;color:#6B7280;">${(file.size/1024).toFixed(1)} KB</div>
        </div>
        <button onclick="quitarArchivo()" style="background:none;border:none;color:#EF4444;cursor:pointer;font-size:16px;"><i class="fa-solid fa-xmark"></i></button>
      </div>`;
  }
  if (dropzone) dropzone.style.display = 'none';
}

function quitarArchivo() {
  uploadedFile = null;
  const preview  = document.getElementById('filePreview');
  const dropzone = document.getElementById('dropzone');
  const fileInput= document.getElementById('fileInput');
  if (preview)  preview.style.display = 'none';
  if (dropzone) dropzone.style.display = 'flex';
  if (fileInput) fileInput.value = '';
}

async function enviarPago() {
  const ref = document.getElementById('referencia')?.value?.trim();
  const met = document.getElementById('metodoPago')?.value;
  const montoInput = document.getElementById('montoPago')?.value;
  const monto = parseFloat(montoInput);

  if (!met) {
    Swal.fire({ title: 'Selecciona el método de pago', icon: 'warning', confirmButtonColor: '#F59E0B' }); return;
  }
  if (!montoInput || isNaN(monto) || monto <= 0) {
    Swal.fire({ title: 'Monto inválido', text: 'Ingresa una cantidad válida mayor a 0.', icon: 'warning', confirmButtonColor: '#F59E0B' }); return;
  }
  if (!ref) {
    Swal.fire({ title: 'Número de referencia requerido', text: 'Ingresa el número de transacción o referencia del pago.', icon: 'warning', confirmButtonColor: '#F59E0B' }); return;
  }
  if (!uploadedFile) {
    Swal.fire({ title: 'Comprobante requerido', text: 'Sube el comprobante de pago para continuar.', icon: 'warning', confirmButtonColor: '#F59E0B' }); return;
  }

  const user = EduUtils.getFromStorage('educredito_user') || {};
  const loans = await EduAPI.get('Prestamos', { id_estudiante: user.id });
  const loan  = (loans || []).find(l => l.estado === 'Activo');
  if (!loan) {
    Swal.fire({ title: 'Sin préstamo activo', icon: 'info' }); return;
  }
  
  const saldoPendiente = parseFloat(loan.saldo || loan.total);
  if (monto > saldoPendiente) {
    Swal.fire({ title: 'Monto excedido', text: `El pago ($${monto.toFixed(2)}) no puede ser mayor al saldo pendiente ($${saldoPendiente.toFixed(2)}).`, icon: 'warning', confirmButtonColor: '#F59E0B' }); return;
  }

  Swal.fire({
    title: 'Procesando...',
    html: 'Subiendo comprobante de pago. Por favor espera.',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  // Subir archivo
  let enlace_comprobante = '';
  const base64Data = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result.replace(/^data:.+;base64,/, ''));
    };
    reader.readAsDataURL(uploadedFile);
  });

  const uploadRes = await EduAPI.uploadFile(base64Data, uploadedFile.name, uploadedFile.type);
  if (uploadRes.success) {
    enlace_comprobante = uploadRes.url;
  } else {
    Swal.fire('Error', 'No se pudo subir el comprobante. Intenta nuevamente.', 'error');
    return;
  }

  const payment = {
    id:          EduUtils.generateId(),
    id_prestamo: loan.id,
    id_estudiante: user.id,
    monto:       monto,
    fecha_pago:  new Date().toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' }),
    metodo:      met,
    referencia:  ref,
    estado:      'Pendiente',
    enlace_comprobante: enlace_comprobante
  };

  await EduAPI.post('Pagos', payment);

  if (typeof EduNotifications !== 'undefined') {
    EduNotifications.agregar('Comprobante enviado', 'Tu comprobante de pago está siendo revisado por el administrador.', 'info');
  }

  await Swal.fire({
    title: '¡Comprobante enviado!',
    text: 'Tu pago está en revisión. Recibirás una notificación cuando sea verificado.',
    icon: 'success',
    confirmButtonText: 'Entendido',
    confirmButtonColor: '#0F8B6D',
  });

  // Recargar
  location.reload();
}
