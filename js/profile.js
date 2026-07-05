/**
 * profile.js – EduCrédito EC
 * Gestión de perfil del estudiante
 */
'use strict';

const FACULTADES = {
  FCJSE:  { nombre: 'Facultad de Ciencias Jurídicas, Sociales y de Educación', carreras: ['Pedagogía de las Ciencias Experimentales - Informática', 'Pedagogía de la Actividad Física y Deporte', 'Educación Básica', 'Educación Inicial', 'Comunicación', 'Psicología', 'Turismo', 'Derecho (modalidad en línea)', 'Turismo Rural, Sostenible e Intercultural (modalidad en línea)'] },
  FAFI:   { nombre: 'Facultad de Administración, Finanzas e Informática', carreras: ['Comercio', 'Contabilidad y Auditoría', 'Sistemas de Información (Tecnologías de la Información)', 'Administración Pública (modalidad en línea)'] },
  FACIAG: { nombre: 'Facultad de Ciencias Agropecuarias', carreras: ['Agronomía', 'Agroindustria', 'Ingeniería Agropecuaria', 'Medicina Veterinaria', 'Gestión Ambiental (modalidad en línea)'] },
  FCS:    { nombre: 'Facultad de Ciencias de la Salud', carreras: ['Enfermería', 'Fisioterapia', 'Nutrición y Dietética', 'Obstetricia', 'Optometría'] },
  EXTQ:   { nombre: 'Extensión Quevedo', carreras: ['Comercio', 'Comunicación', 'Educación Básica', 'Pedagogía de la Actividad Física y Deporte', 'Turismo'] }
};

document.addEventListener('DOMContentLoaded', () => {
  if (typeof EduUtils !== 'undefined') EduUtils.checkSession();
  cargarPerfil();
  initFacultadCarrera();
  initAvatarUpload();
});

function cargarPerfil() {
  const user = JSON.parse(localStorage.getItem('educredito_user') || '{}');
  const fields = ['nombre','apellido','cedula','email','telefono','facultad','carrera','semestre','seccion'];
  fields.forEach(f => {
    const el = document.getElementById(`field-${f}`);
    if (el) el.value = user[f] || '';
  });

  // Avatar
  const avatarEl = document.getElementById('avatarPreview');
  if (avatarEl) {
    if (user.avatar && user.avatar.startsWith('data:')) {
      avatarEl.style.backgroundImage = `url(${user.avatar})`;
      avatarEl.style.backgroundSize  = 'cover';
      avatarEl.innerHTML = '';
    } else {
      avatarEl.innerHTML = `${(user.nombre||'E')[0]}${(user.apellido||'C')[0]}`;
    }
  }

  // Display name in header
  const nameEl = document.getElementById('profileDisplayName');
  if (nameEl) nameEl.textContent = `${user.nombre||''} ${user.apellido||''}`.trim() || 'Mi Perfil';

  const emailEl = document.getElementById('profileDisplayEmail');
  if (emailEl) emailEl.textContent = user.email || '';

  // Cargar carrera basada en facultad guardada
  if (user.facultad) actualizarCarreras(user.facultad, user.carrera);
}

function initFacultadCarrera() {
  const facSelect = document.getElementById('field-facultad');
  if (!facSelect) return;
  facSelect.addEventListener('change', () => actualizarCarreras(facSelect.value));
}

function actualizarCarreras(facultad, selected = '') {
  const carreraSelect = document.getElementById('field-carrera');
  if (!carreraSelect) return;
  const f = FACULTADES[facultad];
  if (!f) { carreraSelect.innerHTML = '<option value="">Selecciona la facultad primero</option>'; return; }
  carreraSelect.innerHTML = f.carreras.map(c => `<option value="${c}" ${c===selected?'selected':''}>${c}</option>`).join('');
}

function initAvatarUpload() {
  const input = document.getElementById('avatarInput');
  if (!input) return;
  input.addEventListener('change', () => {
    if (!input.files.length) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      Swal.fire({ title: 'Solo imágenes', icon: 'warning', confirmButtonColor: '#F59E0B' }); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({ title: 'Imagen demasiado grande', text: 'Máximo 2 MB.', icon: 'warning', confirmButtonColor: '#F59E0B' }); return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const user = JSON.parse(localStorage.getItem('educredito_user') || '{}');
      user.avatar = e.target.result;
      localStorage.setItem('educredito_user', JSON.stringify(user));
      const avatarEl = document.getElementById('avatarPreview');
      if (avatarEl) {
        avatarEl.style.backgroundImage = `url(${e.target.result})`;
        avatarEl.style.backgroundSize  = 'cover';
        avatarEl.innerHTML = '';
      }
      if (typeof EduUtils !== 'undefined') EduUtils.showToast('Foto actualizada', 'success');
    };
    reader.readAsDataURL(file);
  });
}

function guardarPerfil() {
  const user = JSON.parse(localStorage.getItem('educredito_user') || '{}');
  const fields = ['nombre','apellido','telefono','facultad','carrera','semestre','seccion'];
  let valid = true;

  fields.forEach(f => {
    const el = document.getElementById(`field-${f}`);
    if (el) {
      const val = el.value.trim();
      if (!val) {
        el.style.borderColor = '#EF4444';
        valid = false;
      } else {
        el.style.borderColor = '';
        user[f] = val;
      }
    }
  });

  if (!valid) {
    Swal.fire({ title: 'Campos requeridos', text: 'Completa todos los campos del perfil.', icon: 'warning', confirmButtonColor: '#F59E0B' });
    return;
  }

  localStorage.setItem('educredito_user', JSON.stringify(user));
  Swal.fire({ title: '¡Perfil actualizado!', icon: 'success', confirmButtonText: 'Continuar', confirmButtonColor: '#0F8B6D', timer: 2500, timerProgressBar: true });
}

async function cambiarContrasena() {
  const actual   = document.getElementById('passActual')?.value;
  const nueva    = document.getElementById('passNueva')?.value;
  const confirma = document.getElementById('passConfirma')?.value;

  if (!actual || !nueva || !confirma) {
    Swal.fire({ title: 'Completa todos los campos', icon: 'warning', confirmButtonColor: '#F59E0B' }); return;
  }
  if (nueva !== confirma) {
    Swal.fire({ title: 'Las contraseñas no coinciden', icon: 'error', confirmButtonColor: '#EF4444' }); return;
  }
  if (typeof EduValidations !== 'undefined') {
    const r = EduValidations.validatePassword(nueva);
    if (!r.valid) {
      Swal.fire({ title: 'Contraseña insegura', text: r.message, icon: 'warning', confirmButtonColor: '#F59E0B' }); return;
    }
  }

  const user = JSON.parse(localStorage.getItem('educredito_user') || '{}');
  user.password = nueva; // En una app real esto no se haría así
  localStorage.setItem('educredito_user', JSON.stringify(user));

  // Limpiar campos
  ['passActual','passNueva','passConfirma'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  Swal.fire({ title: '¡Contraseña actualizada!', icon: 'success', confirmButtonColor: '#0F8B6D', timer: 2000, timerProgressBar: true });
}
