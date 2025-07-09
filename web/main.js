// ===== MAIN: INICIALIZACIÓN Y LISTENERS GLOBALES =====
import './utils.js';
import { mostrarAplicacion, mostrarLogin, cerrarSesion, setCurrentUser } from './auth.js';
import './websocket.js';
import './navigation.js';
import './paquetes.js';
import './dashboard.js';
import './usuarios.js';
import './historyModal.js';

// Carga inicial de la aplicación

document.addEventListener('DOMContentLoaded', function() {
  // Verificar si hay una sesión activa
  const savedUser = localStorage.getItem('currentUser');
  const savedToken = localStorage.getItem('authToken');
  const savedRefreshToken = localStorage.getItem('refreshToken');
  if (savedUser && savedToken) {
    try {
      const userObj = JSON.parse(savedUser);
      window.currentUser = userObj;
      window.authToken = savedToken;
      window.refreshToken = savedRefreshToken;
      setCurrentUser(userObj);
      mostrarAplicacion();
    } catch (err) {
      console.error('Error al cargar sesión:', err);
      mostrarLogin();
    }
  } else {
    mostrarLogin();
  }
  // Configurar botón de cerrar sesión
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', cerrarSesion);
  }
}); 