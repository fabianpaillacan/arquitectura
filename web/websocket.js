// ===== WEBSOCKET: CONEXIÓN Y MANEJO DE MENSAJES =====
import { toastAlert } from './utils.js';

let wsConnection = null;

function conectarWebSocket(userId) {
  if (wsConnection) {
    wsConnection.close();
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws/${userId}`;
  wsConnection = new WebSocket(wsUrl);
  wsConnection.onopen = function() {
    console.log('WebSocket conectado');
  };
  wsConnection.onmessage = function(event) {
    const data = JSON.parse(event.data);
    manejarMensajeWebSocket(data);
  };
  wsConnection.onerror = function(error) {
    console.error('Error en WebSocket:', error);
  };
  wsConnection.onclose = function() {
    console.log('WebSocket desconectado');
    setTimeout(() => {
      if (window.currentUser) {
        conectarWebSocket(window.currentUser.id);
      }
    }, 5000);
  };
  window.wsConnection = wsConnection;
}

function manejarMensajeWebSocket(data) {
  const currentSection = document.querySelector('main section.active')?.id;
  switch (data.type) {
    case 'paquete_registrado':
      toastAlert(`Nuevo paquete registrado: ${data.paquete.codigo}`, 'info');
      if (currentSection === 'secDashboard') window.loadDashboard();
      break;
    case 'paquete_actualizado':
      toastAlert(`Paquete ${data.paquete.codigo} actualizado por ${data.usuario}`, 'success');
      if (currentSection === 'secDashboard') window.loadDashboard();
      if (currentSection === 'secActualizar') window.loadRecentUpdates();
      break;
    case 'paquete_asignado':
      toastAlert(`Te han asignado el paquete: ${data.paquete_codigo}`, 'warning');
      if (currentSection === 'secMisPaquetes') window.loadRecentUpdates();
      break;
    default:
      console.log('Mensaje WebSocket no manejado:', data);
  }
}

window.conectarWebSocket = conectarWebSocket;
window.manejarMensajeWebSocket = manejarMensajeWebSocket; 