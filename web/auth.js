// ===== AUTH: LOGIN, REGISTRO Y SESIÓN =====
import { toastAlert, rolToText } from './utils.js';

let currentUser = null;
let authToken = localStorage.getItem('authToken');
let refreshToken = localStorage.getItem('refreshToken');

function mostrarLogin() {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('mainContent').style.display = 'none';
  currentUser = null;
  if (window.wsConnection) {
    window.wsConnection.close();
  }
}

function mostrarAplicacion() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  document.getElementById('userInfo').textContent = currentUser.nombre;
  document.getElementById('userName').textContent = currentUser.nombre;
  document.getElementById('userRole').textContent = rolToText(currentUser.rol);
  window.mostrarInterfazPorRol(currentUser.rol);
  window.conectarWebSocket(currentUser.id);
  const btnRegistro = document.querySelector('#formRegistroPaquete button[type="submit"]');
  if (btnRegistro) {
    if (currentUser.rol === 'cliente') {
      btnRegistro.innerHTML = '<i class="bi bi-cart-plus"></i> Comprar Paquete';
    } else {
      btnRegistro.innerHTML = '<i class="bi bi-box"></i> Registrar Paquete';
    }
  }
  if (currentUser.rol === 'admin' || currentUser.rol === 'operador') {
    window.showSection('secDashboard');
  } else if (currentUser.rol === 'repartidor') {
    window.showSection('secMisPaquetes');
  } else if (currentUser.rol === 'cliente') {
    window.showSection('secCliente');
  }
}

async function fetchAuth(url, options = {}) {
  if (!authToken) throw new Error('No hay token de autenticación');
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  const finalOptions = { ...defaultOptions, ...options };
  try {
    const response = await fetch(url, finalOptions);
    if (response.status === 401 && refreshToken) {
      const refreshResponse = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        authToken = refreshData.access_token;
        localStorage.setItem('authToken', authToken);
        finalOptions.headers['Authorization'] = `Bearer ${authToken}`;
        return fetch(url, finalOptions);
      } else {
        cerrarSesion();
        throw new Error('Sesión expirada');
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
}

function cerrarSesion() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUser');
  currentUser = null;
  authToken = null;
  refreshToken = null;
  if (window.wsConnection) {
    window.wsConnection.close();
  }
  mostrarLogin();
  toastAlert('Sesión cerrada', 'info');
}

function setCurrentUser(user) {
  currentUser = user;
}

// Login listener
const formLogin = document.getElementById('formLogin');
if (formLogin) {
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password')
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en login');
      }
      const data = await response.json();
      authToken = data.access_token;
      refreshToken = data.refresh_token;
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      mostrarAplicacion();
      toastAlert(`Bienvenido, ${currentUser.nombre}!`, 'success');
    } catch (err) {
      toastAlert(err.message, 'danger');
    }
  });
}

// Registro listener
const formRegistro = document.getElementById('formRegistro');
if (formRegistro) {
  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          nombre: formData.get('nombre'),
          password: formData.get('password'),
          rol: formData.get('rol'),
          zona_id: formData.get('zona_id') || null
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Error en registro');
      }
      const data = await response.json();
      toastAlert(`Usuario registrado exitosamente. Email: ${data.email}`, 'success');
      const loginTab = document.getElementById('login-tab');
      if (loginTab) loginTab.click();
      e.target.reset();
    } catch (err) {
      toastAlert(err.message, 'danger');
    }
  });
}

export { fetchAuth, cerrarSesion, mostrarLogin, mostrarAplicacion, currentUser, setCurrentUser }; 