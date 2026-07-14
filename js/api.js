window.EduAPI = {
  // Ahora usaremos exclusivamente Apps Script. No más SheetDB.
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxPSQQsvJkWG3rw8ftX9KuqURZa48uiSP50TDkxm6i1XS2j4aJKG9Auu1riocBIGTvkkA/exec',

  /**
   * Asegura que siempre usemos Apps Script y con el método adecuado para saltar el CORS
   * enviando las solicitudes POST como text/plain
   */
  async _fetchAppsScript(payload) {
    if (!this.APPS_SCRIPT_URL) {
      console.error("Falta configurar APPS_SCRIPT_URL");
      return null;
    }
    try {
      const res = await fetch(this.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.error('Error in Apps Script fetch', e);
      return { error: e.message };
    }
  },

  // Obtener datos (lee una hoja entera o busca por parámetros)
  async get(sheetName, searchParams = null) {
    let url = `${this.APPS_SCRIPT_URL}?sheet=${sheetName}`;
    if (searchParams) {
      const query = new URLSearchParams(searchParams).toString();
      url += `&${query}`;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error en la red');
      const data = await res.json();
      
      // La nueva API devuelve un objeto con la propiedad "value" que contiene el array
      if (data && data.value && Array.isArray(data.value)) {
        return data.value;
      }
      return data;
    } catch (e) {
      console.error('Error in API GET', e);
      return [];
    }
  },

  // Crear registro nuevo
  async post(sheetName, data) {
    return this._fetchAppsScript({
      action: 'post',
      sheet: sheetName,
      data: data
    });
  },

  // Actualizar registro existente (simulando PATCH a través de POST)
  async patch(sheetName, id, data) {
    return this._fetchAppsScript({
      action: 'patch',
      sheet: sheetName,
      id: id,
      data: data
    });
  },

  // Subir archivo a Google Drive
  async uploadFile(base64, filename, mimeType) {
    return this._fetchAppsScript({
      action: 'upload',
      base64: base64,
      filename: filename,
      mimeType: mimeType
    });
  }
};
