// ===== NAVEGACIÓN ENTRE SECCIONES Y VISIBILIDAD POR ROL =====
import { rolToText } from './utils.js';

function showSection(id) {
  document.querySelectorAll('main section').forEach((sec) => {
    sec.style.display = 'none';
    sec.classList.remove('active');
  });
  const selectedSection = document.getElementById(id);
  if (selectedSection) {
    selectedSection.style.display = 'block';
    selectedSection.classList.add('active');
  }
  document.querySelectorAll('#navTabs .nav-link').forEach((lnk) => {
    lnk.classList.remove('active');
  });
  document.querySelectorAll('#navTabs .nav-link').forEach((lnk) => {
    if (lnk.getAttribute('onclick') && lnk.getAttribute('onclick').includes(id)) {
      lnk.classList.add('active');
    }
  });
  if (id === 'secDashboard' && window.loadDashboard) window.loadDashboard();
  if (id === 'secActualizar' && window.loadRecentUpdates) window.loadRecentUpdates();
  if (id === 'secUsuarios' && window.loadUsuarios) window.loadUsuarios();
  if (id === 'secMisPaquetes' && window.currentUser && (window.currentUser.rol === 'cliente' || window.currentUser.rol === 'repartidor') && window.loadMisPaquetes) window.loadMisPaquetes();
  if (id === 'secAsignar') {
    if (window.loadPaquetesDisponibles) window.loadPaquetesDisponibles();
    if (window.loadRepartidores) window.loadRepartidores();
  }
}
window.showSection = showSection;

function mostrarInterfazPorRol(rol) {
  actualizarNavegacionPorRol(rol);
}
window.mostrarInterfazPorRol = mostrarInterfazPorRol;

function actualizarNavegacionPorRol(rol) {
  const navItems = {
    cliente: [
      { id: 'secCliente', text: 'Comprar Paquete', icon: 'bi-cart-plus' },
      { id: 'secMisPaquetes', text: 'Mis Paquetes', icon: 'bi-box' }
    ],
    operador: [
      { id: 'secRegistro', text: 'Registrar Paquete', icon: 'bi-box' },
      { id: 'secActualizar', text: 'Actualizar Estado', icon: 'bi-arrow-repeat' },
      { id: 'secAsignar', text: 'Asignar Repartidor', icon: 'bi-person-plus' },
      { id: 'secDashboard', text: 'Dashboard', icon: 'bi-bar-chart' }
    ],
    repartidor: [
      { id: 'secMisPaquetes', text: 'Mis Paquetes', icon: 'bi-box' },
      { id: 'secActualizar', text: 'Actualizar Estado', icon: 'bi-arrow-repeat' },
      { id: 'secDashboard', text: 'Dashboard', icon: 'bi-bar-chart' }
    ],
    admin: [
      { id: 'secDashboard', text: 'Dashboard', icon: 'bi-bar-chart' },
      { id: 'secUsuarios', text: 'Gestión Usuarios', icon: 'bi-people' },
      { id: 'secRegistro', text: 'Registrar Paquete', icon: 'bi-box' }
    ]
  };
  const navContainer = document.getElementById('navTabs');
  if (!navContainer) return;
  navContainer.innerHTML = '';
  const items = navItems[rol] || [];
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.innerHTML = `
      <a class="nav-link ${item.id === 'secDashboard' ? 'active' : ''}" href="#" onclick="showSection('${item.id}')">
        <i class="${item.icon}"></i> ${item.text}
      </a>
    `;
    navContainer.appendChild(li);
  });
}
window.actualizarNavegacionPorRol = actualizarNavegacionPorRol; 