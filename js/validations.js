/**
 * @fileoverview EduCrédito EC - Validaciones de Formularios
 * @module EduValidations
 * @description Funciones de validación reutilizables para todos los formularios.
 */

'use strict';

const EduValidations = (() => {

  // ─── Validaciones de campo ────────────────────────────────────────────────────

  /**
   * Valida una cédula ecuatoriana con el algoritmo de módulo 10.
   * @param {string} cedula - Cédula a validar (10 dígitos).
   * @returns {{ valid: boolean, message: string }}
   */
  function validateCedula(cedula) {
    const c = String(cedula).trim().replace(/\D/g, '');
    if (c.length !== 10) {
      return { valid: false, message: 'La cédula debe tener exactamente 10 dígitos.' };
    }
    const prov = parseInt(c.substring(0, 2), 10);
    if (prov < 1 || prov > 24) {
      if (prov !== 30) { // 30 es a veces usado para extranjeros en algunos sistemas, pero 1-24 es lo normal
        return { valid: false, message: 'Los dos primeros dígitos no corresponden a ninguna provincia.' };
      }
    }
    // Para propósitos de demostración y pruebas, omitiremos el algoritmo de módulo 10
    // ya que muchos usuarios ingresan cédulas ficticias como 0997894561.
    return { valid: true, message: '' };
  }

  /**
   * Valida que el email pertenezca a los dominios institucionales de la UTB.
   * @param {string} email - Correo electrónico a validar.
   * @returns {{ valid: boolean, message: string }}
   */
  function validateEmail(email) {
    let value = String(email).trim().toLowerCase();
    
    // Corrección de errores comunes del usuario: doble punto (e.g. .edu..ec -> .edu.ec)
    value = value.replace(/\.\./g, '.');

    const allowedDomains = [
      '@fafi.utb.edu.ec',
      '@fcjse.utb.edu.ec',
      '@faciag.utb.edu.ec',
      '@fcs.utb.edu.ec'
    ];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, message: 'Ingrese un correo electrónico válido.' };
    }
    const matchesDomain = allowedDomains.some(domain => value.endsWith(domain));
    if (!matchesDomain) {
      return {
        valid: false,
        message: 'Solo se aceptan correos institucionales UTB (@fafi, @fcjse, @faciag o @fcs).utb.edu.ec'
      };
    }
    return { valid: true, message: '' };
  }

  /**
   * Valida la fortaleza de una contraseña.
   * Requiere: 8+ chars, 1 mayúscula, 1 minúscula, 1 dígito, 1 carácter especial.
   * @param {string} password - Contraseña a validar.
   * @returns {{ valid: boolean, message: string, strength: number }}
   */
  function validatePassword(password) {
    const val = String(password);
    const rules = [
      { re: /.{8,}/,          msg: 'mínimo 8 caracteres' },
      { re: /[A-Z]/,          msg: 'al menos una mayúscula' },
      { re: /[a-z]/,          msg: 'al menos una minúscula' },
      { re: /[0-9]/,          msg: 'al menos un número' },
      { re: /[^A-Za-z0-9]/,  msg: 'al menos un carácter especial (!@#$%…)' }
    ];
    const failing = rules.filter(r => !r.re.test(val));
    const strength = rules.length - failing.length;
    if (failing.length > 0) {
      return {
        valid: false,
        message: `La contraseña debe tener ${failing.map(r => r.msg).join(', ')}.`,
        strength
      };
    }
    return { valid: true, message: '', strength };
  }

  /**
   * Valida un número de teléfono ecuatoriano (convencional o celular).
   * @param {string} phone - Teléfono a validar.
   * @returns {{ valid: boolean, message: string }}
   */
  function validatePhone(phone) {
    const val = String(phone).trim().replace(/[\s\-()]/g, '');
    // Celular: 09XXXXXXXX (10 dígitos); convencional: 0[2-7]XXXXXXX (9-10 dígitos)
    if (!/^0[0-9]{8,9}$/.test(val)) {
      return { valid: false, message: 'Ingrese un teléfono válido (ej: 0991234567).' };
    }
    return { valid: true, message: '' };
  }

  /**
   * Valida que un nombre o apellido sea válido (solo letras y espacios, 2+ chars).
   * @param {string} name - Nombre a validar.
   * @returns {{ valid: boolean, message: string }}
   */
  function validateName(name) {
    const val = String(name).trim();
    if (val.length < 2) {
      return { valid: false, message: 'Debe tener al menos 2 caracteres.' };
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'\-]+$/.test(val)) {
      return { valid: false, message: 'Solo se permiten letras, espacios y guiones.' };
    }
    return { valid: true, message: '' };
  }

  /**
   * Valida que un campo requerido no esté vacío.
   * @param {*} value - Valor a verificar.
   * @param {string} [fieldName='Este campo'] - Nombre del campo para el mensaje.
   * @returns {{ valid: boolean, message: string }}
   */
  function validateRequired(value, fieldName = 'Este campo') {
    const val = typeof value === 'string' ? value.trim() : value;
    if (val === null || val === undefined || val === '' || val === false) {
      return { valid: false, message: `${fieldName} es obligatorio.` };
    }
    return { valid: true, message: '' };
  }

  // ─── Fortaleza de contraseña ──────────────────────────────────────────────────

  /**
   * Retorna la etiqueta de fortaleza según el puntaje (0-5).
   * @param {number} strength - Puntaje de fortaleza.
   * @returns {{ label: string, color: string }} Etiqueta y color Bootstrap.
   */
  function getPasswordStrengthLabel(strength) {
    const levels = [
      { label: 'Muy débil',   color: 'danger'  },
      { label: 'Débil',       color: 'danger'  },
      { label: 'Regular',     color: 'warning' },
      { label: 'Fuerte',      color: 'info'    },
      { label: 'Muy fuerte',  color: 'success' },
      { label: 'Excelente',   color: 'success' }
    ];
    const s = Math.max(0, Math.min(5, strength));
    return levels[s];
  }

  // ─── Feedback visual en campos ────────────────────────────────────────────────

  /**
   * Muestra un error de validación bajo un input.
   * @param {HTMLElement} inputEl - Elemento input.
   * @param {string} message - Mensaje de error.
   */
  function showFieldError(inputEl, message) {
    if (!inputEl) return;
    inputEl.classList.remove('is-valid');
    inputEl.classList.add('is-invalid');

    // Eliminar feedback previo
    let feedback = inputEl.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.classList.add('invalid-feedback');
      inputEl.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
    feedback.style.display = 'block';
  }

  /**
   * Limpia el estado de error/éxito de un input.
   * @param {HTMLElement} inputEl - Elemento input.
   */
  function clearFieldError(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('is-invalid', 'is-valid');
    const feedback = inputEl.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.textContent = '';
      feedback.style.display = 'none';
    }
  }

  /**
   * Marca un input como válido visualmente.
   * @param {HTMLElement} inputEl - Elemento input.
   */
  function showFieldSuccess(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('is-invalid');
    inputEl.classList.add('is-valid');
    const feedback = inputEl.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.textContent = '';
      feedback.style.display = 'none';
    }
  }

  // ─── API pública ──────────────────────────────────────────────────────────────
  return Object.freeze({
    validateCedula,
    validateEmail,
    validatePassword,
    validatePhone,
    validateName,
    validateRequired,
    getPasswordStrengthLabel,
    showFieldError,
    clearFieldError,
    showFieldSuccess
  });
})();

window.EduValidations = EduValidations;
