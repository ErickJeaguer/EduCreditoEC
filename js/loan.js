/**
 * loan.js – EduCrédito EC
 * Formulario multi-paso de solicitud de préstamo
 */
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof EduUtils !== 'undefined') EduUtils.checkSession();
  const user = EduUtils.getFromStorage('educredito_user') || {};

  // Verificar préstamo activo
  const loans = await EduAPI.get('Prestamos', { id_estudiante: user.id });
  const hasActive = loans.length > 0 && loans.some(l => ['Activo','Pendiente'].includes(l.estado));
  if (hasActive) {
    Swal.fire({
      title: 'Préstamo en curso',
      text: 'Tienes un préstamo activo o pendiente de revisión. No puedes solicitar uno nuevo hasta cancelarlo.',
      icon: 'warning',
      confirmButtonText: 'Ver mis préstamos',
      confirmButtonColor: '#F59E0B',
      allowOutsideClick: false,
    }).then(() => window.location.href = 'loans.html');
    return;
  }

  // Prefill desde simulación si existe
  const prefill = JSON.parse(sessionStorage.getItem('educredito_sim_prefill') || 'null');
  if (prefill) {
    const monto = prefill.capital;
    const dias  = prefill.dias;
    document.querySelectorAll('.amount-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.amount) === monto);
    });
    document.querySelectorAll('.period-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.days) === dias);
    });
    selectedAmount = monto;
    selectedDays   = dias;
    actualizarResumen();
  }

  initSteps();
});

let step = 1, selectedAmount = 15, selectedDays = 15;
const TOTAL_STEPS = 5;

  const FACULTADES = {
    'FCJSE': [
      'Pedagogía de las Ciencias Experimentales - Informática',
      'Pedagogía de la Actividad Física y Deporte',
      'Educación Básica',
      'Educación Inicial',
      'Comunicación',
      'Psicología',
      'Turismo',
      'Derecho (modalidad en línea)',
      'Turismo Rural, Sostenible e Intercultural (modalidad en línea)'
    ],
    'FAFI': [
      'Comercio',
      'Contabilidad y Auditoría',
      'Sistemas de Información (Tecnologías de la Información)',
      'Administración Pública (modalidad en línea)'
    ],
    'FACIAG': [
      'Agronomía',
      'Agroindustria',
      'Ingeniería Agropecuaria',
      'Medicina Veterinaria',
      'Gestión Ambiental (modalidad en línea)'
    ],
    'FCS': [
      'Enfermería',
      'Fisioterapia',
      'Nutrición y Dietética',
      'Obstetricia',
      'Optometría'
    ],
    'EXTQ': [
      'Comercio',
      'Comunicación',
      'Educación Básica',
      'Pedagogía de la Actividad Física y Deporte',
      'Turismo'
    ]
  };

function initSteps() {
  showStep(1);

  // Setup dropdowns
  const facSelect = document.getElementById('regFacultad');
  const carSelect = document.getElementById('regCarrera');
  const semSelect = document.getElementById('regSemestre');
  const secSelect = document.getElementById('regSeccion');

  if (facSelect && carSelect) {
    facSelect.addEventListener('change', () => {
      const carreras = FACULTADES[facSelect.value] || [];
      carSelect.innerHTML = '<option value="">— Selecciona tu carrera —</option>';
      carreras.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        carSelect.appendChild(opt);
      });
      carSelect.disabled = carreras.length === 0;
    });
  }

  // Prefill academic info if user already has it
  const user = JSON.parse(localStorage.getItem('educredito_user') || '{}');
  if (user.facultad && facSelect) {
    facSelect.value = user.facultad;
    facSelect.dispatchEvent(new Event('change'));
    if (user.carrera) carSelect.value = user.carrera;
    if (user.semestre && semSelect) semSelect.value = user.semestre;
    if (user.seccion && secSelect) secSelect.value = user.seccion;
  }

  // Amount buttons
  document.querySelectorAll('.amount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAmount = parseInt(btn.dataset.amount);
      actualizarResumen();
    });
  });

  // Period buttons
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDays = parseInt(btn.dataset.days);
      actualizarResumen();
    });
  });

  actualizarResumen();
}

function showStep(n) {
  step = n;
  document.querySelectorAll('.form-step').forEach((s, i) => {
    s.style.display = (i + 1 === n) ? 'block' : 'none';
  });
  // Progress dots
  document.querySelectorAll('.step-dot').forEach((d, i) => {
    d.classList.toggle('active', i + 1 === n);
    d.classList.toggle('done',   i + 1 < n);
  });
  document.querySelectorAll('.step-line').forEach((l, i) => {
    l.classList.toggle('done', i + 1 < n);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
  if (!validateStep(step)) return;
  if (step < TOTAL_STEPS) showStep(step + 1);
  if (step === TOTAL_STEPS) renderResumenFinal();
}

function prevStep() {
  if (step > 1) showStep(step - 1);
}

function validateStep(s) {
  if (s === 1) {
    const f = document.getElementById('regFacultad')?.value;
    const c = document.getElementById('regCarrera')?.value;
    const sem = document.getElementById('regSemestre')?.value;
    const sec = document.getElementById('regSeccion')?.value;
    
    if (!f || !c || !sem || !sec) {
      Swal.fire({ title: 'Campos requeridos', text: 'Por favor completa toda tu información académica.', icon: 'warning', confirmButtonColor: '#F59E0B' });
      return false;
    }
    
    const fileInput = document.getElementById('regCertificado');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      Swal.fire({ title: 'Certificado requerido', text: 'Debes subir tu certificado de notas en formato PDF.', icon: 'warning', confirmButtonColor: '#F59E0B' });
      return false;
    }
  }
  if (s === 2) {
    if (!selectedAmount) {
      Swal.fire({ title: 'Selecciona un monto', icon: 'warning', confirmButtonColor: '#F59E0B' });
      return false;
    }
  }
  if (s === 3) {
    const motivo = document.getElementById('motivo')?.value?.trim();
    if (!motivo || motivo.length < 10) {
      Swal.fire({ title: 'Motivo requerido', text: 'Describe brevemente el motivo del préstamo (mínimo 10 caracteres).', icon: 'warning', confirmButtonColor: '#F59E0B' });
      return false;
    }
  }
  if (s === 4) {
    const fields = ['garanteNombre','garanteCedula','garanteRelacion','garanteTelefono','garanteDireccion','garanteOcupacion'];
    for (const f of fields) {
      const val = document.getElementById(f)?.value?.trim();
      if (!val) {
        Swal.fire({ title: 'Campos requeridos', text: 'Completa todos los datos del garante.', icon: 'warning', confirmButtonColor: '#F59E0B' });
        return false;
      }
    }
    // Validar cédula del garante
    if (typeof EduValidations !== 'undefined') {
      const ced = document.getElementById('garanteCedula')?.value?.trim();
      const r = EduValidations.validateCedula(ced);
      if (!r.valid) {
        Swal.fire({ title: 'Cédula inválida', text: r.message, icon: 'error', confirmButtonColor: '#EF4444' });
        return false;
      }
    }
  }
  return true;
}

function actualizarResumen() {
  const rates = { 7: 5, 15: 7, 30: 10 };
  const tasa  = rates[selectedDays] || 7;
  const interes = parseFloat((selectedAmount * (tasa / 100)).toFixed(2));
  const total   = parseFloat((selectedAmount + interes).toFixed(2));
  const hoy    = new Date();
  const vence  = new Date(hoy.getTime() + selectedDays * 86400000);
  const fmt    = d => d.toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' });

  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('previewMonto',   `$${selectedAmount.toFixed(2)}`);
  set('previewTasa',    `${tasa}%`);
  set('previewInteres', `$${interes.toFixed(2)}`);
  set('previewTotal',   `$${total.toFixed(2)}`);
  set('previewFecha',   fmt(hoy));
  set('previewVence',   fmt(vence));
  set('previewPlazo',   `${selectedDays} días`);
}

function renderResumenFinal() {
  const rates = { 7: 5, 15: 7, 30: 10 };
  const tasa  = rates[selectedDays] || 7;
  const interes = parseFloat((selectedAmount * (tasa / 100)).toFixed(2));
  const total   = parseFloat((selectedAmount + interes).toFixed(2));
  const hoy    = new Date();
  const vence  = new Date(hoy.getTime() + selectedDays * 86400000);
  const fmt    = d => d.toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' });

  const garante = document.getElementById('garanteNombre')?.value || 'N/A';
  const motivo  = document.getElementById('motivo')?.value || 'N/A';

  const container = document.getElementById('resumenFinal');
  if (!container) return;
  container.innerHTML = `
    <div class="card-custom p-4">
      <h5 class="mb-4" style="color:#1F2937;font-weight:700;"><i class="fa-solid fa-receipt me-2 text-primary"></i>Resumen de la solicitud</h5>
      <div class="row g-3">
        <div class="col-md-6"><div class="result-row"><span class="result-label">Monto solicitado</span><span class="result-value" style="color:#0F8B6D;font-size:20px;font-weight:800;">$${selectedAmount.toFixed(2)}</span></div></div>
        <div class="col-md-6"><div class="result-row"><span class="result-label">Plazo</span><span class="result-value">${selectedDays} días</span></div></div>
        <div class="col-md-6"><div class="result-row"><span class="result-label">Tasa de interés</span><span class="result-value">${tasa}%</span></div></div>
        <div class="col-md-6"><div class="result-row"><span class="result-label">Interés</span><span class="result-value" style="color:#F59E0B;">$${interes.toFixed(2)}</span></div></div>
        <div class="col-12"><hr style="border-color:#E5E7EB;margin:4px 0;"></div>
        <div class="col-md-6"><div class="result-row"><span class="result-label" style="font-weight:700;">Total a pagar</span><span class="result-value" style="color:#2563EB;font-size:22px;font-weight:800;">$${total.toFixed(2)}</span></div></div>
        <div class="col-md-6"><div class="result-row"><span class="result-label">Fecha límite</span><span class="result-value" style="color:#EF4444;">${fmt(vence)}</span></div></div>
        <div class="col-md-6"><div class="result-row"><span class="result-label">Motivo</span><span class="result-value">${motivo}</span></div></div>
        <div class="col-md-6"><div class="result-row"><span class="result-label">Garante</span><span class="result-value">${garante}</span></div></div>
      </div>
    </div>`;
}

async function confirmarSolicitud() {
  const ok = await Swal.fire({
    title: '¿Confirmar solicitud?',
    text: 'Tu solicitud será enviada al administrador para revisión.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Revisar',
    confirmButtonColor: '#0F8B6D',
  });
  if (!ok.isConfirmed) return;

  const btnConf = document.querySelector('.swal2-confirm');
  
  // Mostrar cargando global
  Swal.fire({
    title: 'Procesando...',
    html: 'Subiendo archivo y enviando solicitud. Por favor espera.',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  const rates = { 7: 5, 15: 7, 30: 10 };
  const tasa   = rates[selectedDays] || 7;
  const interes = parseFloat((selectedAmount * (tasa / 100)).toFixed(2));
  const total   = parseFloat((selectedAmount + interes).toFixed(2));
  const hoy    = new Date();
  const vence  = new Date(hoy.getTime() + selectedDays * 86400000);
  const fmt    = d => d.toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' });

  const user   = EduUtils.getFromStorage('educredito_user') || {};
  const garante = document.getElementById('garanteNombre')?.value || 'N/A';
  const garanteCedula = document.getElementById('garanteCedula')?.value || 'N/A';
  const motivo  = document.getElementById('motivo')?.value || 'N/A';

  // Guardar la información académica del usuario (Actualizando BD)
  const f = document.getElementById('regFacultad')?.value;
  const c = document.getElementById('regCarrera')?.value;
  const sem = document.getElementById('regSemestre')?.value;
  const sec = document.getElementById('regSeccion')?.value;
  
  if (user && f) {
    user.facultad = f;
    user.carrera = c;
    user.semestre = sem;
    user.seccion = sec;
    EduUtils.setToStorage('educredito_user', user);
    await EduAPI.patch('Usuarios', user.id, user); // Update in SheetDB
  }

  // Subir archivo a Drive
  let enlace_certificado = '';
  const fileInput = document.getElementById('regCertificado');
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    
    // Leer el archivo como Base64
    const base64Data = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remover el header data:application/pdf;base64,
        const base64String = reader.result.replace(/^data:.+;base64,/, '');
        resolve(base64String);
      };
      reader.readAsDataURL(file);
    });

    const uploadRes = await EduAPI.uploadFile(base64Data, file.name, file.type);
    if (uploadRes.success) {
      enlace_certificado = uploadRes.url;
    } else {
      Swal.fire('Error', 'No se pudo subir el certificado. Intenta nuevamente.', 'error');
      return;
    }
  }

  // Objeto para la hoja 'Prestamos'
  const loan = {
    id: EduUtils.generateId(),
    id_estudiante: user.id,
    monto: selectedAmount,
    plazo: selectedDays,
    interes: interes,
    total: total,
    fecha_solicitud: fmt(hoy),
    estado: 'Pendiente',
    motivo: motivo,
    garante_nombre: garante,
    garante_cedula: garanteCedula,
    enlace_certificado: enlace_certificado
  };

  const dbRes = await EduAPI.post('Prestamos', loan);

  sessionStorage.removeItem('educredito_sim_prefill');

  if (typeof EduNotifications !== 'undefined') {
    EduNotifications.agregar('Solicitud enviada', `Tu solicitud de $${selectedAmount.toFixed(2)} por ${selectedDays} días fue enviada. Espera la revisión.`, 'info');
  }

  await Swal.fire({
    title: '¡Solicitud enviada!',
    text: 'Tu solicitud está en revisión. Te notificaremos cuando sea procesada.',
    icon: 'success',
    confirmButtonText: 'Ver mis préstamos',
    confirmButtonColor: '#0F8B6D',
  });

  window.location.href = 'loans.html';
}
