/**
 * @fileoverview EduCrédito EC - Módulo de Login
 * @module login
 * @description Maneja la autenticación de usuarios (estudiantes y administrador).
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ─── Redirigir si ya hay sesión ───────────────────────────────────────────────

  if (typeof EduUtils !== 'undefined' && EduUtils.isLoggedIn()) {
    const role = EduUtils.getRole();
    window.location.href = role === 'admin' ? 'admin/dashboard.html' : 'student/dashboard.html';
    return;
  }

  // ─── Inicializar Usuario Demo ───────────────────────────────────────────────
  
  if (typeof EduUtils !== 'undefined') {
    let allStudents = EduUtils.getFromStorage('educredito_all_students') || [];
    if (!allStudents.some(s => s.email === 'eaherreral@fcjse.utb.edu.ec')) {
      allStudents.push({
        id: 'stu-demo-007',
        nombre: 'Andrés',
        apellido: 'Herrera',
        email: 'eaherreral@fcjse.utb.edu.ec',
        passwordHash: btoa('123Andres007'),
        facultad: 'FCJSE',
        carrera: 'Pedagogía de las Ciencias Experimentales en Informática',
        semestre: '8',
        seccion: 'A',
        estado: 'Activo',
        fechaRegistro: new Date().toLocaleDateString('es-EC')
      });
      EduUtils.setToStorage('educredito_all_students', allStudents);
    }
  }

  // ─── Selectores DOM ───────────────────────────────────────────────────────────

  const form         = document.getElementById('loginForm');
  const emailInput   = document.getElementById('loginEmail');
  const passInput    = document.getElementById('loginPassword');
  const togglePassBtn = document.getElementById('togglePass'); // FIXED ID
  const rememberChk  = document.getElementById('rememberMe');
  const submitBtn    = document.getElementById('loginSubmitBtn');
  const spinner      = document.getElementById('loginSpinner');
  const formCard     = document.getElementById('loginCard') || document.querySelector('.login-card');

  // Constantes de admin
  const ADMIN_EMAIL    = 'admin@educredito.utb.edu.ec';
  const ADMIN_PASSWORD = 'Admin2026*';

  // ─── Remember Me ─────────────────────────────────────────────────────────────

  /**
   * Pre-llena el email si el usuario eligió "Recordarme" previamente.
   */
  (function prefillRemembered() {
    const remembered = localStorage.getItem('educredito_remember_email');
    if (remembered && emailInput) {
      emailInput.value = remembered;
      if (rememberChk) rememberChk.checked = true;
    }
  })();

  // ─── Toggle visibilidad de contraseña ────────────────────────────────────────

  /**
   * Alterna la visibilidad del campo de contraseña.
   */
  if (togglePassBtn && passInput) {
    togglePassBtn.addEventListener('click', () => {
      const isText = passInput.type === 'text';
      passInput.type = isText ? 'password' : 'text';
      const icon = togglePassBtn.querySelector('i');
      if (icon) {
        icon.className = isText ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash'; // FIXED ICONS
      }
      togglePassBtn.setAttribute('aria-label', isText ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
  }

  // ─── Animación de shake ───────────────────────────────────────────────────────

  /**
   * Aplica animación de sacudida al formulario al fallar el login.
   */
  function shakeForm() {
    const target = formCard || form;
    if (!target) return;
    target.classList.remove('shake-animation');
    // Forzar reflow para reiniciar la animación
    void target.offsetWidth;
    target.classList.add('shake-animation');
    setTimeout(() => target.classList.remove('shake-animation'), 700);
  }

  // ─── Estado del botón submit ──────────────────────────────────────────────────

  /**
   * Muestra/oculta el spinner de carga en el botón de submit.
   * @param {boolean} loading - Si es true, muestra el spinner.
   */
  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (spinner) spinner.classList.toggle('d-none', !loading);
    const btnText = submitBtn.querySelector('.btn-text');
    if (btnText) btnText.textContent = loading ? 'Verificando...' : 'Ingresar';
  }

  // ─── Simulación de autenticación ──────────────────────────────────────────────

  async function authenticate(email, password) {
    let e = email.trim().toLowerCase();
    e = e.replace(/\.\./g, '.');
    const p = password;

    // Autenticación de administrador
    if (e === ADMIN_EMAIL && p === ADMIN_PASSWORD) {
      return {
        success: true,
        role: 'admin',
        user: { id: 'admin-001', nombre: 'Administrador', apellido: 'EduCrédito', email: ADMIN_EMAIL, facultad: 'Admin', carrera: 'Administración', semestre: '—', seccion: '—', estado: 'Activo' },
        message: '¡Bienvenido, Administrador!'
      };
    }

    if (e === ADMIN_EMAIL && p !== ADMIN_PASSWORD) {
      return { success: false, role: null, user: null, message: 'Contraseña de administrador incorrecta.' };
    }

    // Validar dominio institucional
    const validDomains = ['@fafi.utb.edu.ec', '@fcjse.utb.edu.ec', '@faciag.utb.edu.ec', '@fcs.utb.edu.ec'];
    const isUTB = validDomains.some(d => e.endsWith(d));
    if (!isUTB) {
      return { success: false, role: null, user: null, message: 'Solo se permiten correos institucionales UTB.' };
    }

    if (p.length < 8) {
      return { success: false, role: null, user: null, message: 'La contraseña debe tener al menos 8 caracteres.' };
    }

    // Buscar estudiante en SheetDB
    const students = await EduAPI.get('Usuarios', { email: e });
    
    if (students && students.length > 0) {
      const student = students[0];
      // La contraseña en la DB puede estar en hash (btoa) o texto plano dependiendo del registro
      if (student.password !== btoa(p) && student.password !== p) {
        return { success: false, role: null, user: null, message: 'Contraseña incorrecta. Verifica tus datos.' };
      }
      if (student.estado === 'Suspendido') {
        return { success: false, role: null, user: null, message: 'Tu cuenta está suspendida. Contacta al administrador.' };
      }
      return { success: true, role: student.rol || 'student', user: student, message: `¡Bienvenido, ${student.nombre}!` };
    }

    return {
      success: false,
      role: null,
      user: null,
      message: 'Correo no registrado. Por favor regístrate primero.'
    };
  }

  // ─── Submit del formulario ────────────────────────────────────────────────────

  /**
   * Maneja el envío del formulario de login.
   * @param {Event} e - Evento de submit.
   */
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!emailInput || !passInput) return;

      const email    = emailInput.value.trim();
      const password = passInput.value;

      // Validación básica de campos vacíos
      if (!email || !password) {
        if (typeof EduUtils !== 'undefined') {
          EduUtils.showToast('Por favor completa todos los campos.', 'warning');
        }
        shakeForm();
        return;
      }

      setLoading(true);

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = await authenticate(email, password);

      if (result.success) {
        // Guardar "Recordarme"
        if (rememberChk && rememberChk.checked) {
          localStorage.setItem('educredito_remember_email', email);
        } else {
          localStorage.removeItem('educredito_remember_email');
        }

        // Guardar sesión y usuario
        if (typeof EduUtils !== 'undefined') {
          EduUtils.setToStorage('educredito_session', {
            loggedIn: true,
            role: result.role,
            loginTime: Date.now()
          });
          EduUtils.setToStorage('educredito_user', result.user);
        }

        // Notificación de bienvenida
        if (typeof Swal !== 'undefined') {
          await Swal.fire({
            title: '¡Acceso exitoso!',
            text: result.message,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }

        // Redirigir según rol
        if (result.role === 'admin') {
          window.location.href = 'admin/dashboard.html';
        } else {
          window.location.href = 'student/dashboard.html';
        }

      } else {
        setLoading(false);
        shakeForm();

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: 'Error de acceso',
            text: result.message,
            icon: 'error',
            confirmButtonText: 'Intentar de nuevo',
            confirmButtonColor: '#dc3545'
          });
        } else if (typeof EduUtils !== 'undefined') {
          EduUtils.showToast(result.message, 'error');
        }
      }
    });
  }

  // ─── Validación en tiempo real ────────────────────────────────────────────────

  /**
   * Limpia errores visuales al escribir en los inputs.
   */
  [emailInput, passInput].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      if (typeof EduValidations !== 'undefined') {
        EduValidations.clearFieldError(input);
      }
    });
  });

  // ─── Agregar CSS de shake si no existe ───────────────────────────────────────

  if (!document.getElementById('login-shake-style')) {
    const style = document.createElement('style');
    style.id = 'login-shake-style';
    style.textContent = `
      @keyframes shake {
        0%,100%{transform:translateX(0)}
        15%{transform:translateX(-8px)}
        30%{transform:translateX(8px)}
        45%{transform:translateX(-6px)}
        60%{transform:translateX(6px)}
        75%{transform:translateX(-4px)}
        90%{transform:translateX(4px)}
      }
      .shake-animation { animation: shake 0.6s ease-in-out; }
    `;
    document.head.appendChild(style);
  }

});
