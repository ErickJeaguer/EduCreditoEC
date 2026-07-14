window.EduAPI = {
  SHEETDB_URL: 'https://sheetdb.io/api/v1/xbwaopomvxqql',
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzSytsp6TRAno-cokMO3TTQMCiU5HFN29DiwFXyJMrH-Tv_7-g1r4yWm-ajOeRM_gCo0A/exec',

  // Obtener datos (lee una hoja entera o busca por parámetros)
  // sheetName: 'Usuarios', 'Prestamos', 'Pagos'
  async get(sheetName, searchParams = null) {
    let url = `${this.SHEETDB_URL}?sheet=${sheetName}`;
    if (searchParams) {
      // La API de SheetDB permite buscar: /search?sheet=Usuarios&email=...
      url = `${this.SHEETDB_URL}/search?sheet=${sheetName}&`;
      const query = new URLSearchParams(searchParams).toString();
      url += query;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error en la red');
      return await res.json();
    } catch (e) {
      console.error('Error in API GET', e);
      return [];
    }
  },

  // Crear registro
  async post(sheetName, data) {
    try {
      const res = await fetch(`${this.SHEETDB_URL}?sheet=${sheetName}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data })
      });
      return await res.json();
    } catch (e) {
      console.error('Error in API POST', e);
      return { error: e.message };
    }
  },

  // Actualizar registro (buscando por columna 'id')
  async patch(sheetName, id, data) {
    try {
      const res = await fetch(`${this.SHEETDB_URL}/id/${id}?sheet=${sheetName}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data })
      });
      return await res.json();
    } catch (e) {
      console.error('Error in API PATCH', e);
      return { error: e.message };
    }
  },

  // Subir archivo a Google Drive (vía Apps Script)
  async uploadFile(base64, filename, mimeType) {
    if (!this.APPS_SCRIPT_URL) {
      console.warn("Atención: Aún no se ha configurado la URL de Apps Script. Simulando subida...");
      return new Promise(resolve => setTimeout(() => resolve({ success: true, url: 'https://drive.google.com/file/d/MOCK_ENLACE/view' }), 1500));
    }
    
    try {
      const res = await fetch(this.APPS_SCRIPT_URL, {
        method: 'POST',
        // Usamos text/plain para evitar el error de preflight CORS en Apps Script
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ base64, filename, mimeType })
      });
      return await res.json();
    } catch (e) {
      console.error('Error en la subida de archivo', e);
      return { success: false, error: e.message };
    }
  }
};
