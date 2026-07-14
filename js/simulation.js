/**
 * simulation.js – EduCrédito EC
 * Motor del simulador financiero (público y privado)
 * Todos los cálculos se realizan aquí; JS solo muestra resultados.
 */

'use strict';

window.EduSimulation = (() => {

  /* ─── Tasas por defecto (se leen de localStorage/settings) ─── */
  const DEFAULT_RATES = { 15: 5, 30: 7, 45: 9, 60: 12 };
  const DEFAULT_AMOUNTS = [5, 10, 15, 20, 25];

  let selectedAmount = 15;
  let selectedDays   = 15;

  /**
   * Obtiene las tasas desde localStorage settings.
   * @returns {{ 7: number, 15: number, 30: number }}
   */
  function getRates() {
    try {
      const s = JSON.parse(localStorage.getItem('educredito_settings') || '{}');
      return s.tasas || DEFAULT_RATES;
    } catch { return DEFAULT_RATES; }
  }

  /**
   * Obtiene los montos disponibles desde settings.
   * @returns {number[]}
   */
  function getAmounts() {
    try {
      const s = JSON.parse(localStorage.getItem('educredito_settings') || '{}');
      return s.montos || DEFAULT_AMOUNTS;
    } catch { return DEFAULT_AMOUNTS; }
  }

  /**
   * Calcula los datos del préstamo.
   * @param {number} capital - Monto del préstamo en dólares
   * @param {number} dias    - Plazo en días
   * @returns {{ capital, tasa, interes, total, fechaInicio, fechaVencimiento, dias }}
   */
  function calcularPrestamo(capital, dias) {
    const rates = getRates();
    const tasa  = rates[dias] ?? 5;
    const interes = parseFloat((capital * (tasa / 100)).toFixed(2));
    const total   = parseFloat((capital + interes).toFixed(2));

    const hoy    = new Date();
    const vence  = new Date(hoy.getTime() + dias * 86400000);

    const fmt = d => d.toLocaleDateString('es-EC', { day:'2-digit', month:'2-digit', year:'numeric' });

    return {
      capital:         parseFloat(capital.toFixed(2)),
      tasa,
      interes,
      total,
      fechaInicio:     fmt(hoy),
      fechaVencimiento:fmt(vence),
      dias,
      rawVence:        vence,
      rawInicio:       hoy,
    };
  }

  /**
   * Actualiza el DOM del simulador con animación fadeIn.
   * Busca los IDs estándar del simulador.
   * @param {object} data - resultado de calcularPrestamo()
   * @param {string} [prefix=''] - prefijo para IDs (permite dos simuladores en la misma página)
   */
  function actualizarUI(data, prefix = '') {
    const $ = id => document.getElementById(prefix + id);
    const card = $('resultCard') || document.getElementById('resultCard');
    if (card) {
      card.classList.remove('animate-fade-in');
      void card.offsetWidth;
      card.classList.add('animate-fade-in');
    }

    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    set('res-monto',       `$${data.capital.toFixed(2)}`);
    set('res-tasa',        `${data.tasa}%`);
    set('res-interes',     `$${data.interes.toFixed(2)}`);
    set('res-total',       `$${data.total.toFixed(2)}`);
    set('res-fecha-inicio', data.fechaInicio);
    set('res-fecha-vence',  data.fechaVencimiento);
    set('res-plazo',       `${data.dias} días`);
  }

  /**
   * Renderiza el comparador de los 3 plazos.
   * @param {number} amount - Monto base
   * @param {string} containerId - ID del contenedor HTML
   */
  function renderComparador(amount, containerId) {
    const container = document.getElementById(containerId || 'comparadorCards');
    if (!container) return;
    const rates = getRates();
    const options = [
      { dias: 7,  label: '7 días',  icon: '⚡', color: '#10B981', colorBg: '#D1FAE5', badge: 'Menor costo'   },
      { dias: 15, label: '15 días', icon: '⭐', color: '#F59E0B', colorBg: '#FEF3C7', badge: 'Recomendado'   },
      { dias: 30, label: '30 días', icon: '📅', color: '#EF4444', colorBg: '#FEE2E2', badge: 'Mayor plazo'   },
    ];

    container.innerHTML = options.map((o, i) => {
      const d = calcularPrestamo(amount, o.dias);
      return `
        <div class="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="${(i+1)*100}">
          <div class="comparador-card" style="--comp-color:${o.color}; border-top-color:${o.color}">
            <div class="comp-badge" style="background:${o.color}">${o.badge}</div>
            <div class="comp-plazo">${o.label}</div>
            <div class="comp-tasa">${o.icon} ${d.tasa}% de interés</div>
            <div class="comp-desglose">
              <div class="comp-row"><span>Capital</span><span>$${d.capital.toFixed(2)}</span></div>
              <div class="comp-row"><span>Interés</span><span style="color:${o.color}">$${d.interes.toFixed(2)}</span></div>
              <div class="comp-row comp-total"><span>Total</span><span>$${d.total.toFixed(2)}</span></div>
              <div class="comp-row"><span>Vence</span><span>${d.fechaVencimiento}</span></div>
            </div>
            <a href="login.html" class="btn-comp" style="background:${o.color}">Solicitar ahora</a>
          </div>
        </div>`;
    }).join('');
    if (typeof AOS !== 'undefined') AOS.refresh();
  }

  /**
   * Guarda la simulación actual en localStorage.
   * @returns {object} La simulación guardada
   */
  function guardarSimulacion() {
    const data = calcularPrestamo(selectedAmount, selectedDays);
    const sim = {
      id:     Date.now().toString(),
      fecha:  new Date().toLocaleDateString('es-EC'),
      monto:  data.capital,
      plazo:  data.dias,
      tasa:   data.tasa,
      interes:data.interes,
      total:  data.total,
      vence:  data.fechaVencimiento,
    };
    const lista = JSON.parse(localStorage.getItem('educredito_simulations') || '[]');
    lista.unshift(sim);
    if (lista.length > 10) lista.length = 10; // máximo 10
    localStorage.setItem('educredito_simulations', JSON.stringify(lista));
    return sim;
  }

  /**
   * Convierte la simulación actual en solicitud.
   * Guarda en sessionStorage y redirige al formulario.
   */
  function convertirASolicitud() {
    const data = calcularPrestamo(selectedAmount, selectedDays);
    sessionStorage.setItem('educredito_sim_prefill', JSON.stringify(data));
    window.location.href = 'loan-request.html';
  }

  /**
   * Imprime la simulación actual.
   */
  function imprimirSimulacion() {
    window.print();
  }

  /**
   * Calcula el interés por mora.
   * @param {number} saldo - Saldo pendiente
   * @returns {{ mora, nuevoSaldo }}
   */
  function calcularMora(saldo) {
    const settings = JSON.parse(localStorage.getItem('educredito_settings') || '{}');
    const tasaMora = settings.mora || 2;
    const mora = parseFloat((saldo * (tasaMora / 100)).toFixed(2));
    const nuevoSaldo = parseFloat((saldo + mora).toFixed(2));
    return { mora, nuevoSaldo, tasaMora };
  }

  /* ── API pública ────────────────────────────────────────────── */
  return {
    calcularPrestamo,
    actualizarUI,
    renderComparador,
    guardarSimulacion,
    convertirASolicitud,
    imprimirSimulacion,
    calcularMora,
    getRates,
    getAmounts,
    get selectedAmount() { return selectedAmount; },
    get selectedDays()   { return selectedDays; },
    setAmount(v) {
      selectedAmount = v;
      const data = calcularPrestamo(v, selectedDays);
      actualizarUI(data);
    },
    setDays(v) {
      selectedDays = v;
      const data = calcularPrestamo(selectedAmount, v);
      actualizarUI(data);
    },
  };
})();
