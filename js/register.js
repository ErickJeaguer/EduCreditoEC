/**
 * @fileoverview EduCrédito EC - Módulo de Registro
 * @module register
 * @description Formulario multi-paso de registro de estudiantes (3 pasos).
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ─── Estado del formulario multi-paso ────────────────────────────────────────

  /** @type {number} Paso actual (1-3) */
  let currentStep = 1;
  const TOTAL_STEPS = 3;

  /** @type {Object} Datos acumulados del formulario */
  const formData = {};

  // ─── Selectores DOM ───────────────────────────────────────────────────────────

  const steps        = document.querySelectorAll('.form-step');
  const stepIndicators = document.querySelectorAll('.reg-step-dot');
  const stepLabels   = document.querySelectorAll('.step-lbl');
  const stepLines    = document.querySelectorAll('.reg-step-line');
  const btnNext      = document.getElementById('btnNext');
  const btnBack      = document.getElementById('btnBack');
  const strengthBar  = document.getElementById('strFill');
  const strengthText = document.getElementById('strText');
  
  const termsScroll  = document.getElementById('termsScroll');
  const acceptTerms  = document.getElementById('acceptTerms');

  // ─── Navegación de pasos ──────────────────────────────────────────────────────

  /**
   * Muestra el paso indicado y actualiza los indicadores.
   * @param {number} step - Número de paso a mostrar (1-3).
   */
  function goToStep(step) {
    steps.forEach((el, idx) => {
      if (idx + 1 === step) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Actualizar indicadores de pasos
    stepIndicators.forEach((el, idx) => {
      el.classList.remove('active', 'done');
      if (idx + 1 < step) el.classList.add('done');
      if (idx + 1 === step) el.classList.add('active');
    });

    stepLabels.forEach((el, idx) => {
      el.classList.remove('active', 'done');
      if (idx + 1 < step) el.classList.add('done');
      if (idx + 1 === step) el.classList.add('active');
    });

    stepLines.forEach((el, idx) => {
      el.classList.remove('done');
      if (idx + 1 < step) el.classList.add('done');
    });

    // Botones de navegación
    if (btnBack) btnBack.style.display = step === 1 ? 'none' : 'block';
    
    if (btnNext) {
      if (step === TOTAL_STEPS) {
        btnNext.innerHTML = 'Crear cuenta <i class="fa-solid fa-check ms-2"></i>';
      } else {
        btnNext.innerHTML = 'Continuar <i class="fa-solid fa-arrow-right ms-2"></i>';
      }
    }

    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─── Validación por paso ──────────────────────────────────────────────────────

  /**
   * Valida los campos del paso actual. Retorna true si todo es válido.
   * @param {number} step - Paso a validar.
   * @returns {Promise<boolean>}
   */
  async function validateStep(step) {
    const V = EduValidations;
    let isValid = true;

    if (step === 1) {
      const nombre   = document.getElementById('regNombre');
      const apellido = document.getElementById('regApellido');
      const cedula   = document.getElementById('regCedula');
      const telefono = document.getElementById('regTelefono');
      const email    = document.getElementById('regEmail');

      const nRes = V.validateName(nombre?.value || '');
      if (!nRes.valid) { V.showFieldError(nombre, nRes.message); isValid = false; }
      else V.showFieldSuccess(nombre);

      const aRes = V.validateName(apellido?.value || '');
      if (!aRes.valid) { V.showFieldError(apellido, aRes.message); isValid = false; }
      else V.showFieldSuccess(apellido);

      const cRes = V.validateCedula(cedula?.value || '');
      if (!cRes.valid) { V.showFieldError(cedula, cRes.message); isValid = false; }
      else V.showFieldSuccess(cedula);

      const tRes = V.validatePhone(telefono?.value || '');
      if (!tRes.valid) { V.showFieldError(telefono, tRes.message); isValid = false; }
      else V.showFieldSuccess(telefono);

      const eRes = V.validateEmail(email?.value || '');
      if (!eRes.valid) { V.showFieldError(email, eRes.message); isValid = false; }
      else {
        btnNext.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
        btnNext.disabled = true;
        const students = await EduAPI.get('Usuarios', { email: email.value.trim().toLowerCase() });
        btnNext.innerHTML = 'Continuar <i class="fa-solid fa-arrow-right ms-2"></i>';
        btnNext.disabled = false;
        
        if (students && students.length > 0) {
          V.showFieldError(email, 'Este correo ya está registrado. Por favor inicia sesión.');
          isValid = false;
        } else {
          V.showFieldSuccess(email);
        }
      }

      if (isValid) {
        formData.nombre   = nombre.value.trim();
        formData.apellido = apellido.value.trim();
        formData.cedula   = cedula.value.trim();
        formData.telefono = telefono.value.trim();
        formData.email    = email.value.trim().toLowerCase();
      }
    }

    if (step === 2) {
      const password  = document.getElementById('regPassword');
      const confirm   = document.getElementById('regConfirm');

      const pRes = V.validatePassword(password?.value || '');
      if (!pRes.valid) { V.showFieldError(password, pRes.message); isValid = false; }
      else V.showFieldSuccess(password);

      if (password?.value !== confirm?.value) {
        V.showFieldError(confirm, 'Las contraseñas no coinciden.');
        isValid = false;
      } else if (confirm?.value) {
        V.showFieldSuccess(confirm);
      }

      if (isValid) {
        formData.password = password.value;
      }
    }

    if (step === 3) {
      if (!acceptTerms?.checked) {
        EduUtils.showToast('Debes leer y aceptar los términos y condiciones para continuar.', 'warning');
        isValid = false;
      }
    }

    return isValid;
  }

  // ─── Botones de navegación y Submit ──────────────────────────────────────────

  if (btnNext) {
    btnNext.addEventListener('click', async () => {
      const valid = await validateStep(currentStep);
      if (!valid) return;

      if (currentStep < TOTAL_STEPS) {
        goToStep(currentStep + 1);
      } else {
        // ─── Submit Final ───
        btnNext.disabled = true;
        btnNext.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';

        await new Promise(r => setTimeout(r, 1000));

        const newUser = {
          id:           EduUtils.generateId(),
          nombre:       formData.nombre,
          apellido:     formData.apellido,
          cedula:       formData.cedula,
          telefono:     formData.telefono,
          email:        formData.email,
          facultad:     '',
          carrera:      '',
          semestre:     '',
          seccion:      '',
          password:     btoa(formData.password), // Se guarda en hash básico para simular DB
          rol:          'student',
          eduscore:     500
        };

        const result = await EduAPI.post('Usuarios', newUser);
        if (result && result.error) {
          EduUtils.showToast('Error al registrar usuario: ' + result.error, 'error');
          btnNext.disabled = false;
          btnNext.innerHTML = 'Crear cuenta <i class="fa-solid fa-check ms-2"></i>';
          return;
        }

        const notifications = [];
        notifications.push({
          id:      EduUtils.generateId(),
          titulo:  '¡Bienvenido a EduCrédito EC!',
          mensaje: `Hola ${newUser.nombre}, tu cuenta ha sido creada exitosamente. Para solicitar tu microcrédito, primero deberás completar tu información académica en el formulario de solicitud.`,
          tipo:    'success',
          leida:   false,
          fecha:   new Date().toISOString(),
          userId:  newUser.id
        });
        EduUtils.setToStorage(`educredito_notifications_${newUser.id}`, notifications);

        await Swal.fire({
          title: '¡Registro exitoso!',
          html:  `<p>¡Bienvenido, <strong>${newUser.nombre}</strong>!</p>
                  <p>Tu cuenta ha sido creada. Ya puedes iniciar sesión.</p>`,
          icon:  'success',
          confirmButtonText: 'Ir al Login',
          confirmButtonColor: '#0F8B6D',
          allowOutsideClick: false
        });

        window.location.href = 'login.html';
      }
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => {
      if (currentStep > 1) goToStep(currentStep - 1);
    });
  }

  // ─── Toggles de Contraseña ──────────────────────────────────────────────────
  
  const btnTogglePass = document.getElementById('btnTogglePass');
  const btnToggleConf = document.getElementById('btnToggleConf');

  function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input && icon) {
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    }
  }

  if (btnTogglePass) {
    btnTogglePass.addEventListener('click', () => togglePasswordVisibility('regPassword', 'eyePass'));
  }
  if (btnToggleConf) {
    btnToggleConf.addEventListener('click', () => togglePasswordVisibility('regConfirm', 'eyeConf'));
  }

  // ─── Barra de fortaleza de contraseña ────────────────────────────────────────

  const passInput = document.getElementById('regPassword');
  if (passInput && strengthBar && strengthText) {
    passInput.addEventListener('input', () => {
      const result = EduValidations.validatePassword(passInput.value);
      const s = result.strength;
      const { label, color } = EduValidations.getPasswordStrengthLabel(s);
      const pct = Math.round((s / 5) * 100);

      strengthBar.style.width = pct + '%';
      
      // Update checkmarks
      const val = passInput.value;
      const checks = [
        { id: 'chk8', re: /.{8,}/ },
        { id: 'chkUpper', re: /[A-Z]/ },
        { id: 'chkLower', re: /[a-z]/ },
        { id: 'chkNum', re: /[0-9]/ },
        { id: 'chkSpecial', re: /[^A-Za-z0-9]/ }
      ];
      
      checks.forEach(check => {
        const el = document.getElementById(check.id);
        if (el) {
          if (check.re.test(val)) {
            el.classList.add('ok');
            el.querySelector('i').className = 'fa-solid fa-circle-check';
          } else {
            el.classList.remove('ok');
            el.querySelector('i').className = 'fa-solid fa-circle-xmark';
          }
        }
      });
      
      // Colors mapping from Bootstrap to our CSS or inline
      const colorMap = {
        'danger': '#EF4444',
        'warning': '#F59E0B',
        'info': '#3B82F6',
        'success': '#10B981'
      };
      
      strengthBar.style.backgroundColor = colorMap[color] || '#E5E7EB';
      strengthText.textContent = passInput.value ? label : 'Ingresa una contraseña';
      strengthText.style.color = passInput.value ? (colorMap[color] || '#9CA3AF') : '#9CA3AF';
    });
  }

  // ─── Scroll de términos y condiciones ─────────────────────────────────────────

  if (termsScroll && acceptTerms) {
    termsScroll.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = termsScroll;
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        acceptTerms.disabled = false;
        const hint = document.getElementById('termsHint');
        if (hint) hint.style.display = 'none';
      }
    });
  }

  // ─── Validación en blur (tiempo real) ────────────────────────────────────────

  document.querySelectorAll('#registerForm input').forEach(input => {
    input.addEventListener('blur', () => {
      const V = EduValidations;
      const id = input.id;

      if (id === 'regNombre' || id === 'regApellido') {
        const r = V.validateName(input.value);
        r.valid ? V.showFieldSuccess(input) : V.showFieldError(input, r.message);
      }
      if (id === 'regCedula') {
        const r = V.validateCedula(input.value);
        r.valid ? V.showFieldSuccess(input) : V.showFieldError(input, r.message);
      }
      if (id === 'regTelefono') {
        const r = V.validatePhone(input.value);
        r.valid ? V.showFieldSuccess(input) : V.showFieldError(input, r.message);
      }
      if (id === 'regEmail') {
        const r = V.validateEmail(input.value);
        if (!r.valid) {
          V.showFieldError(input, r.message);
        } else {
          // No hacemos validación en blur para no saturar la API
          V.showFieldSuccess(input);
        }
      }
      if (id === 'regPassword') {
        const r = V.validatePassword(input.value);
        r.valid ? V.showFieldSuccess(input) : V.showFieldError(input, r.message);
      }
      if (id === 'regConfirm') {
        const pass = document.getElementById('regPassword');
        if (input.value !== pass?.value) {
          V.showFieldError(input, 'Las contraseñas no coinciden.');
        } else if (input.value) {
          V.showFieldSuccess(input);
        }
      }
    });
  });

  // ─── Inicializar en paso 1 ────────────────────────────────────────────────────
  goToStep(1);

});
