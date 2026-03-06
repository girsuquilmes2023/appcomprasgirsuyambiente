import { FullAppState } from '../types';

export const syncWithGoogleSheets = async (scriptUrl: string, data: FullAppState): Promise<boolean> => {
  if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com')) {
    console.warn("URL de Google Sheets no válida o no configurada.");
    return false;
  }
  
  try {
    const payload = {
      ...data,
      syncMetadata: {
        lastSync: new Date().toISOString(),
        device: 'Web App Portal'
      }
    };

    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      body: JSON.stringify({ action: 'SAVE', payload }),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', 
      },
    });
    
    console.log("Datos enviados a la nube exitosamente.");
    return true;
  } catch (error) {
    console.error("Error crítico de envío a nube:", error);
    return false;
  }
};

export const loadFromGoogleSheets = async (scriptUrl: string): Promise<FullAppState | null> => {
  if (!scriptUrl || !scriptUrl.startsWith('https://script.google.com')) return null;
  
  try {
    const separator = scriptUrl.includes('?') ? '&' : '?';
    const finalUrl = `${scriptUrl}${separator}action=LOAD&t=${Date.now()}`;
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) throw new Error('Servidor de Google no disponible');
    
    const text = await response.text();
    
    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      console.error("Error: Permisos incorrectos en Google Apps Script. Debe estar como 'Cualquier persona' (Anyone).");
      return null;
    }

    if (!text || text === "{}" || text === "null" || text === "Accion invalida") return null;
    
    const data = JSON.parse(text);
    if (data && (data.items || data.orders || data.categories)) {
      return data as FullAppState;
    }
    return null;
  } catch (error) {
    console.error("Error de descarga desde nube:", error);
    return null;
  }
};
