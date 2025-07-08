// ===== VARIABLES GLOBALES =====
let currentUser = null;
let wsConnection = null;
let authToken = localStorage.getItem('authToken');

// ===== FUNCIÓN PARA MOSTRAR ALERTAS TOAST =====
// Crea y muestra alertas temporales en la esquina superior derecha de la pantalla
function toastAlert(msg, type = "info") {
  // Crea el toast
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3" role="alert" style="z-index:1080;">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  const toast = wrapper.firstElementChild;
  document.body.appendChild(toast);

  // Elimina el toast automáticamente después de 10 segundos
  setTimeout(() => {
    toast.classList.remove("show");      // Quita clase para animar fade out
    setTimeout(() => toast.remove(), 500); // Elimina del DOM tras la animación (0.5s)
  }, 10000);
}


// ===== FUNCIÓN PARA LOGIN DE USUARIOS DE PRUEBA =====
function loginTestUser(email, password) {
  const emailInput = document.querySelector('#formLogin input[name="email"]');
  const passwordInput = document.querySelector('#formLogin input[name="password"]');
  
  if (emailInput && passwordInput) {
    emailInput.value = email;
    passwordInput.value = password;
    document.getElementById('formLogin').dispatchEvent(new Event('submit'));
  }
}
// Hace la función disponible globalmente
window.loginTestUser = loginTestUser;

// ===== FUNCIÓN PARA MANEJAR CAMBIO DE ROL EN REGISTRO =====
function handleRolChange() {
  const rolSelect = document.querySelector('#formRegistro select[name="rol"]');
  const zonaField = document.getElementById('zonaField');
  
  if (rolSelect && zonaField) {
    if (rolSelect.value === 'repartidor') {
      zonaField.style.display = 'block';
      zonaField.querySelector('input').required = true;
    } else {
      zonaField.style.display = 'none';
      zonaField.querySelector('input').required = false;
    }
  }
}

// ===== FUNCIÓN AUXILIAR PARA GENERAR PILLS DE ESTADO =====
// Convierte el estado del paquete en un badge visual con colores específicos
function pill(estado) {
  // Mapeo de estados a clases de Bootstrap para colores
  const map = {
    procesando: "info",        // Azul claro
    en_bodega: "secondary",    // Gris
    en_transito: "warning",    // Amarillo
    en_reparto: "warning",     // Amarillo
    entregado: "success",      // Verde
    devuelto: "danger",        // Rojo
  };
  // Obtiene la clase CSS correspondiente al estado, o "secondary" por defecto
  const cls = map[estado] || "secondary";
  // Retorna el HTML del badge con el estado formateado (reemplaza _ por espacios)
  return `<span class="badge bg-${cls} text-capitalize">${estado.replace("_", " ")}</span>`;
}

// ===== FUNCIÓN PARA CONVERTIR ROL A TEXTO =====
function rolToText(rol) {
  const roles = {
    cliente: "Cliente",
    operador: "Operador", 
    repartidor: "Repartidor",
    admin: "Administrador"
  };
  return roles[rol] || rol;
}

// ===== FUNCIÓN DE NAVEGACIÓN ENTRE SECCIONES =====
// Controla la visibilidad de las diferentes secciones de la aplicación
function showSection(id) {
  // Oculta todas las secciones primero
  document.querySelectorAll("main section").forEach((sec) => {
    sec.style.display = 'none';
    sec.classList.remove('active');
  });
  
  // Muestra solo la sección seleccionada
  const selectedSection = document.getElementById(id);
  if (selectedSection) {
    selectedSection.style.display = 'block';
    selectedSection.classList.add('active');
  }
  
  // Actualiza el estado activo de los enlaces de navegación
  document.querySelectorAll("#navTabs .nav-link").forEach((lnk) => {
    lnk.classList.remove('active');
  });
  
  // Marca como activo el enlace correspondiente
  document.querySelectorAll("#navTabs .nav-link").forEach((lnk) => {
    if (lnk.getAttribute("onclick") && lnk.getAttribute("onclick").includes(id)) {
      lnk.classList.add('active');
    }
  });
  
  // Carga datos específicos según la sección seleccionada
  if (id === "secDashboard") loadDashboard();
  if (id === "secActualizar") loadRecentUpdates();
  if (id === "secUsuarios") loadUsuarios();
  if (id === "secMisPaquetes" && (currentUser.rol === 'cliente' || currentUser.rol === 'repartidor')) loadMisPaquetes();
  if (id === "secAsignar") {
    loadPaquetesDisponibles();
    loadRepartidores();
  }
}
// Hace la función disponible globalmente para ser llamada desde HTML
window.showSection = showSection;

// ===== FUNCIÓN PARA MOSTRAR INTERFAZ POR ROL =====
function mostrarInterfazPorRol(rol) {
  // Solo actualiza la navegación según el rol
  actualizarNavegacionPorRol(rol);
}

// ===== FUNCIÓN PARA ACTUALIZAR NAVEGACIÓN POR ROL =====
function actualizarNavegacionPorRol(rol) {
  const navItems = {
    cliente: [
      { id: 'secCliente', text: 'Seguimiento', icon: 'bi-geo-alt' },
      { id: 'secMisPaquetes', text: 'Mis Paquetes', icon: 'bi-box' },
      { id: 'secRegistro', text: 'Comprar Paquete', icon: 'bi-cart-plus' }
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

// ===== FUNCIÓN PARA CONECTAR WEBSOCKET =====
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
    // Reconectar después de 5 segundos
    setTimeout(() => {
      if (currentUser) {
        conectarWebSocket(currentUser.id);
      }
    }, 5000);
  };
}

// ===== FUNCIÓN PARA MANEJAR MENSAJES WEBSOCKET =====
function manejarMensajeWebSocket(data) {
  switch (data.type) {
    case 'paquete_registrado':
      toastAlert(`Nuevo paquete registrado: ${data.paquete.codigo}`, "info");
      if (currentSection === 'secDashboard') loadDashboard();
      break;
      
    case 'paquete_actualizado':
      toastAlert(`Paquete ${data.paquete.codigo} actualizado por ${data.usuario}`, "success");
      if (currentSection === 'secDashboard') loadDashboard();
      if (currentSection === 'secActualizar') loadRecentUpdates();
      break;
      
    case 'paquete_asignado':
      toastAlert(`Te han asignado el paquete: ${data.paquete_codigo}`, "warning");
      if (currentSection === 'secMisPaquetes') loadRecentUpdates();
      break;
      
    default:
      console.log('Mensaje WebSocket no manejado:', data);
  }
}

// ===== FUNCIÓN PARA HACER PETICIONES AUTENTICADAS =====
async function fetchAuth(url, options = {}) {
  if (!authToken) {
    throw new Error('No hay token de autenticación');
  }
  
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  const response = await fetch(url, finalOptions);
  
  if (response.status === 401) {
    // Token expirado o inválido
    localStorage.removeItem('authToken');
    mostrarLogin();
    throw new Error('Sesión expirada');
  }
  
  return response;
}

// ===== FUNCIÓN PARA MOSTRAR LOGIN =====
function mostrarLogin() {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('mainContent').style.display = 'none';
  currentUser = null;
  if (wsConnection) {
    wsConnection.close();
  }
}

// ===== FUNCIÓN PARA MOSTRAR APLICACIÓN PRINCIPAL =====
function mostrarAplicacion() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  mostrarInterfazPorRol(currentUser.rol);
  conectarWebSocket(currentUser.id);

  // Actualizar texto del botón de registro según el rol
  const btnRegistro = document.querySelector('#formRegistroPaquete button[type="submit"]');
  if (btnRegistro) {
    if (currentUser.rol === 'cliente') {
      btnRegistro.innerHTML = '<i class="bi bi-cart-plus"></i> Comprar Paquete';
    } else {
      btnRegistro.innerHTML = '<i class="bi bi-box"></i> Registrar Paquete';
    }
  }

  // Mostrar sección por defecto según el rol
  if (currentUser.rol === 'admin' || currentUser.rol === 'operador') {
    showSection('secDashboard');
  } else if (currentUser.rol === 'repartidor') {
    showSection('secMisPaquetes');
  } else if (currentUser.rol === 'cliente') {
    showSection('secCliente');
  }
}

// ===== EVENT LISTENER PARA LOGIN =====
const formLogin = document.getElementById("formLogin");
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      currentUser = data.user;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      mostrarAplicacion();
      toastAlert(`Bienvenido, ${currentUser.nombre}!`, "success");
    } catch (err) {
      toastAlert(err.message, "danger");
    }
  });
}

// ===== EVENT LISTENER PARA REGISTRO DE USUARIO =====
const formRegistro = document.getElementById("formRegistro");
if (formRegistro) {
  formRegistro.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      toastAlert(`Usuario registrado exitosamente. Email: ${data.email}`, "success");
      const loginTab = document.getElementById('login-tab');
      if (loginTab) {
        loginTab.click();
      }
      e.target.reset();
    } catch (err) {
      toastAlert(err.message, "danger");
    }
  });
}

// ===== EVENT LISTENER PARA CAMBIO DE ROL EN REGISTRO =====
document.querySelector('#formRegistro select[name="rol"]')?.addEventListener("change", handleRolChange);

// ===== EVENT LISTENER PARA REGISTRO DE PAQUETE =====
const formRegistroPaquete = document.getElementById("formRegistroPaquete");
if (formRegistroPaquete) {
  formRegistroPaquete.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      const res = await fetchAuth("/paquetes", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const mensaje = currentUser.rol === 'cliente' 
        ? `Paquete comprado exitosamente. Código: <strong>${data.codigo}</strong>`
        : `Paquete registrado. Código: <strong>${data.codigo}</strong>`;
      toastAlert(mensaje, "success");
      e.target.reset();
      // Si es cliente, recargar mis paquetes
      if (currentUser.rol === 'cliente') {
        loadMisPaquetes();
      }
    } catch (err) {
      toastAlert("Error al registrar paquete", "danger");
    }
  });
}

// ===== EVENT LISTENER PARA ACTUALIZAR ESTADO =====
const formActualizar = document.getElementById("formActualizar");
if (formActualizar) {
  formActualizar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      const res = await fetchAuth("/paquetes/estado", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toastAlert("Estado actualizado", "success");
      loadRecentUpdates();
    } catch (err) {
      toastAlert("No se pudo actualizar el paquete", "danger");
    }
  });
}

// ===== EVENT LISTENER PARA ASIGNAR REPARTIDOR =====
const formAsignar = document.getElementById("formAsignar");
if (formAsignar) {
  formAsignar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      const res = await fetchAuth("/paquetes/asignar", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toastAlert("Paquete asignado exitosamente", "success");
      e.target.reset();
    } catch (err) {
      toastAlert("Error al asignar paquete", "danger");
    }
  });
}

// ===== FUNCIÓN PARA CREAR EL MODAL DE HISTORIAL =====
// Crea dinámicamente el modal que muestra el historial de un paquete
function createHistoryModal() {
  // Verifica si el modal ya existe para evitar duplicados
  let modalEl = document.getElementById("historialModal");
  if (modalEl) {
    return modalEl;
  }

  // Crea el elemento modal con Bootstrap
  modalEl = document.createElement("div");
  modalEl.className = "modal fade";
  modalEl.id = "historialModal";
  modalEl.tabIndex = -1;
  modalEl.setAttribute("aria-labelledby", "historialModalLabel");
  modalEl.setAttribute("aria-hidden", "true");
  
  // Define el HTML completo del modal
  modalEl.innerHTML = `
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title" id="historialModalLabel">
            <i class="bi bi-clock-history"></i> Historial del Paquete: <span id="histCode"></span>
          </h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-0">
          <div id="historialContent">
            <div class="text-center p-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
            <i class="bi bi-x-circle"></i> Cerrar
          </button>
        </div>
      </div>
    </div>`;
  
  // Añade el modal al body del documento
  document.body.appendChild(modalEl);
  return modalEl;
}

// ===== FUNCIÓN PARA MOSTRAR EL HISTORIAL =====
// Muestra el modal con el historial completo de un paquete
function showHistoryModal(codigo, paqueteData) {
  // Obtiene o crea el modal
  const modalEl = createHistoryModal();
  
  // Actualiza el código del paquete en el título del modal
  modalEl.querySelector("#histCode").textContent = codigo;
  
  // Obtiene el contenedor donde se mostrará el contenido
  const historialContent = modalEl.querySelector("#historialContent");
  
  // Verifica si hay datos del paquete y eventos para mostrar
  if (paqueteData && paqueteData.eventos && paqueteData.eventos.length > 0) {
    const eventos = paqueteData.eventos;
    
    // Genera el HTML completo del historial
    historialContent.innerHTML = `
      <!-- Información del paquete -->
      <div class="card border-0">
        <div class="card-header bg-light">
          <h6 class="mb-0"><i class="bi bi-info-circle"></i> Información del Paquete</h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p><strong>Empresa:</strong> ${paqueteData.empresa}</p>
              <p><strong>Destinatario:</strong> ${paqueteData.destinatario}</p>
              <p><strong>Dirección:</strong> ${paqueteData.direccion}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Teléfono:</strong> ${paqueteData.telefono}</p>
              <p><strong>Ruta:</strong> ${paqueteData.ruta}</p>
              <p><strong>Estado Actual:</strong> ${pill(paqueteData.estado)}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Timeline de eventos -->
      <div class="card border-0">
        <div class="card-header bg-light">
          <h6 class="mb-0"><i class="bi bi-clock-history"></i> Historial de Cambios (${eventos.length} eventos)</h6>
        </div>
        <div class="card-body p-0">
          <div class="timeline-container">
            ${eventos.map((evento, index) => {
              // Convierte la fecha del evento a objeto Date
              const fecha = new Date(evento.fecha);
              // Determina si es el evento más reciente
              const isLatest = index === eventos.length - 1;
              
              // Genera el HTML para cada evento en el timeline
              return `
                <div class="timeline-item ${isLatest ? 'latest' : ''}">
                  <div class="timeline-marker ${isLatest ? 'bg-success' : 'bg-primary'}">
                    <i class="bi bi-${getEventIcon(evento.estado)} text-white"></i>
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <h6 class="mb-1">${pill(evento.estado)}</h6>
                      <small class="text-muted">
                        <i class="bi bi-calendar"></i> ${fecha.toLocaleDateString('es-ES')} 
                        <i class="bi bi-clock"></i> ${fecha.toLocaleTimeString('es-ES')}
                        ${evento.comentario ? `<br><i class='bi bi-person'></i> ${evento.comentario}` : ''}
                      </small>
                    </div>
                    <p class="mb-0">
                      <i class="bi bi-geo-alt"></i> <strong>Ubicación:</strong> ${evento.ubicacion}
                      ${evento.comentario ? `<br><i class='bi bi-chat'></i> <strong>Comentario:</strong> ${evento.comentario}` : ''}
                    </p>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;
  } else {
    // Muestra un mensaje si no hay eventos
    historialContent.innerHTML = `
      <div class="text-center p-5">
        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
        <h5 class="mt-3">Sin eventos registrados</h5>
        <p class="text-muted">No se encontraron eventos para este paquete.</p>
      </div>`;
  }
  
  // Muestra el modal usando Bootstrap
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// ===== FUNCIÓN AUXILIAR PARA OBTENER ICONOS DE EVENTOS =====
// Retorna el icono de Bootstrap correspondiente a cada estado
function getEventIcon(estado) {
  // Mapeo de estados a iconos de Bootstrap Icons
  const iconMap = {
    procesando: 'arrow-clockwise',    // Icono de procesamiento
    en_bodega: 'house',               // Icono de casa/bodega
    en_transito: 'truck',             // Icono de camión
    en_reparto: 'person-walking',     // Icono de persona caminando
    entregado: 'check-circle',        // Icono de check
    devuelto: 'arrow-return-left'     // Icono de retorno
  };
  // Retorna el icono correspondiente o 'circle' por defecto
  return iconMap[estado] || 'circle';
}

// ===== CONFIGURACIÓN DEL BOTÓN DE HISTORIAL =====
// Configura el botón "Ver Historial" cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  // Busca el botón de historial en el formulario de actualizar
  const historyBtn = document.querySelector("#formActualizar button.btn-outline-secondary");
  
  // Si encuentra el botón, le añade el event listener
  if (historyBtn) {
    historyBtn.addEventListener("click", async function(e) {
      // Previene cualquier comportamiento por defecto del botón
      e.preventDefault();
      
      // Obtiene el valor del campo de código de seguimiento
      const codeInput = document.querySelector("#formActualizar input[name='codigo']");
      const codigo = codeInput ? codeInput.value.trim() : '';
      
      // Valida que se haya ingresado un código
      if (!codigo) {
        toastAlert("Por favor, introduce el código de seguimiento primero", "warning");
        if (codeInput) codeInput.focus();
        return;
      }
      
      try {
        // Muestra un mensaje de carga
        toastAlert("Cargando historial...", "info");
        
        // Hace la petición GET al endpoint del paquete específico
        const res = await fetchAuth(`/paquetes/${encodeURIComponent(codigo)}`);
        
        // Maneja diferentes tipos de respuesta
        if (!res.ok) {
          if (res.status === 404) {
            toastAlert("No se encontró ningún paquete con ese código", "warning");
          } else {
            throw new Error(`Error ${res.status}`);
          }
          return;
        }
        
        // Convierte la respuesta a JSON y muestra el modal
        const paqueteData = await res.json();
        showHistoryModal(codigo, paqueteData);
        
      } catch (err) {
        // Maneja errores de red o del servidor
        console.error("Error al obtener el historial:", err);
        toastAlert("No se pudo obtener el historial del paquete. Verifique el código e intente nuevamente.", "danger");
      }
    });
  }
});

// ===== EVENT LISTENER PARA SEGUIMIENTO CLIENTE =====
const formCliente = document.getElementById("formCliente");
if (formCliente) {
  formCliente.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = e.target.codigo.value.trim();
    const div = document.getElementById("clienteInfo");
    if (!code) {
      div.innerHTML = `<div class="alert alert-warning">Por favor, ingrese un código de seguimiento</div>`;
      return;
    }
    div.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary"></div><p class="mt-2">Buscando paquete...</p></div>';
    try {
      const res = await fetchAuth(`/paquetes/${encodeURIComponent(code)}`);
      if (res.ok) {
        const paqueteData = await res.json();
        mostrarInformacionPaquete(paqueteData, div);
      } else {
        throw new Error(`Error ${res.status}`);
      }
    } catch (err) {
      console.error("Error al buscar paquete:", err);
      div.innerHTML = `<div class="alert alert-danger"><i class="bi bi-x-circle"></i> Error al buscar el paquete. Verifique el código e intente nuevamente.</div>`;
    }
  });
}

// ===== FUNCIÓN PARA MOSTRAR INFORMACIÓN DEL PAQUETE =====
function mostrarInformacionPaquete(paqueteData, container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0"><i class="bi bi-box"></i> Información del Paquete</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <p><strong>Código:</strong> ${paqueteData.codigo}</p>
            <p><strong>Empresa:</strong> ${paqueteData.empresa}</p>
            <p><strong>Destinatario:</strong> ${paqueteData.destinatario}</p>
            <p><strong>Dirección:</strong> ${paqueteData.direccion}</p>
          </div>
          <div class="col-md-6">
            <p><strong>Teléfono:</strong> ${paqueteData.telefono}</p>
            <p><strong>Ruta:</strong> ${paqueteData.ruta}</p>
            <p><strong>Estado Actual:</strong> ${pill(paqueteData.estado)}</p>
            <p><strong>Ubicación:</strong> ${paqueteData.ubicacion}</p>
          </div>
        </div>
        <hr>
        <h6><i class="bi bi-clock-history"></i> Últimos Eventos</h6>
        <div class="timeline-container">
          ${paqueteData.eventos.slice(-3).map(evento => {
            const fecha = new Date(evento.fecha);
            return `
              <div class="timeline-item">
                <div class="timeline-marker bg-primary">
                  <i class="bi bi-${getEventIcon(evento.estado)} text-white"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <h6 class="mb-1">${pill(evento.estado)}</h6>
                    <small class="text-muted">
                      <i class="bi bi-calendar"></i> ${fecha.toLocaleDateString('es-ES')} 
                      <i class="bi bi-clock"></i> ${fecha.toLocaleTimeString('es-ES')}
                      ${evento.comentario ? `<br><i class='bi bi-person'></i> ${evento.comentario}` : ''}
                    </small>
                  </div>
                  <p class="mb-0">
                    <i class="bi bi-geo-alt"></i> <strong>Ubicación:</strong> ${evento.ubicacion}
                  </p>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>`;
}

// ===== FUNCIÓN PARA CARGAR ACTUALIZACIONES RECIENTES =====
// Carga y muestra los paquetes más recientes en el panel derecho
async function loadRecentUpdates() {
  const container = document.getElementById("recentUpdates");
  if (!container) return;
  container.innerHTML = "<div class='text-muted'><i class='bi bi-arrow-clockwise'></i> Cargando…</div>";
  try {
    const res = await fetchAuth("/paquetes?limit=5");
    if (!res.ok) throw new Error();
    const data = await res.json();
    container.innerHTML = data.length
      ? data.map(p => `
          <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
              <strong>${p.codigo}</strong><br />
              <small class="text-muted"><i class="bi bi-geo-alt"></i> ${p.destinatario} → ${p.ubicacion}${p.cliente ? ` | <i class='bi bi-person'></i> ${p.cliente}` : ''}</small>
            </div>
            ${pill(p.estado)}
          </div>`).join("")
      : `<div class='text-muted'><i class='bi bi-inbox'></i> Sin registros</div>`;
  } catch (err) {
    container.innerHTML = `<div class='text-danger'><i class='bi bi-exclamation-triangle'></i> No disponible</div>`;
  }
}

// ===== FUNCIÓN PARA CARGAR EL DASHBOARD =====
// Carga y muestra las estadísticas del dashboard
async function loadDashboard() {
  // Obtiene el contenedor del dashboard
  const dash = document.getElementById("dashboardInfo");
  if (!dash) return;
  
  try {
    // Hace la petición GET al endpoint del dashboard
    const res = await fetchAuth("/dashboard");
    if (!res.ok) throw new Error();
    const d = await res.json();
    
    // Genera el HTML con las estadísticas en tarjetas
    dash.innerHTML = `
      <div class="col-6 col-lg-3">
        <div class="card card-border text-center">
          <div class="card-body">
            <i class="bi bi-box fs-3 text-primary"></i>
            <h6 class="text-muted mt-2">Paquetes Activos</h6>
            <h2 class="text-primary">${d.total}</h2>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card card-border text-center">
          <div class="card-body">
            <i class="bi bi-truck fs-3 text-warning"></i>
            <h6 class="text-muted mt-2">En Tránsito</h6>
            <h2 class="text-warning">${d.en_transito}</h2>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card card-border text-center">
          <div class="card-body">
            <i class="bi bi-house fs-3 text-secondary"></i>
            <h6 class="text-muted mt-2">En Bodega</h6>
            <h2 class="text-secondary">${d.en_bodega}</h2>
          </div>
        </div>
      </div>
      <div class="col-6 col-lg-3">
        <div class="card card-border text-center">
          <div class="card-body">
            <i class="bi bi-check-circle fs-3 text-success"></i>
            <h6 class="text-muted mt-2">Entregados</h6>
            <h2 class="text-success">${d.entregado}</h2>
          </div>
        </div>
      </div>`;
  } catch (err) {
    // Muestra un mensaje de error si no se puede cargar el dashboard
    dash.innerHTML = `<div class='text-danger'><i class='bi bi-exclamation-triangle'></i> No se pudo cargar dashboard</div>`;
  }
}

// ===== FUNCIÓN PARA CERRAR SESIÓN =====
function cerrarSesion() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  currentUser = null;
  authToken = null;
  
  if (wsConnection) {
    wsConnection.close();
  }
  
  mostrarLogin();
  toastAlert("Sesión cerrada", "info");
}

// ===== CARGA INICIAL DE LA APLICACIÓN =====
// Se ejecuta cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si hay una sesión activa
  const savedUser = localStorage.getItem('currentUser');
  const savedToken = localStorage.getItem('authToken');
  
  if (savedUser && savedToken) {
    try {
      currentUser = JSON.parse(savedUser);
      authToken = savedToken;
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

// ===== FUNCIÓN PARA CARGAR Y MOSTRAR USUARIOS (ADMIN) =====
async function loadUsuarios() {
  const container = document.getElementById('usuariosTableContainer');
  if (!container) return;
  container.innerHTML = '<div class="text-muted"><i class="bi bi-arrow-clockwise"></i> Cargando…</div>';
  try {
    const res = await fetchAuth('/usuarios');
    if (!res.ok) throw new Error();
    const usuarios = await res.json();
    if (!usuarios.length) {
      container.innerHTML = '<div class="text-muted">No hay usuarios registrados.</div>';
      return;
    }
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-bordered table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Email</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>ID</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            ${usuarios.map(u => `
              <tr>
                <td>${u.email}</td>
                <td>${u.nombre}</td>
                <td>${rolToText(u.rol)}</td>
                <td>${u.rol === 'repartidor' ? u.id : ''}</td>
                <td>${u.activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</td>
                <td>
                  <button class="btn btn-sm ${u.activo ? 'btn-danger' : 'btn-success'}" onclick="toggleUsuarioActivo('${u.id}', ${u.activo})">
                    ${u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<div class="text-danger">No se pudo cargar la lista de usuarios.</div>';
  }
}
window.loadUsuarios = loadUsuarios;

// ===== FUNCIÓN PARA ACTIVAR/DESACTIVAR USUARIO =====
async function toggleUsuarioActivo(id, activo) {
  try {
    const res = await fetchAuth(`/usuarios/${id}/activo`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: !activo })
    });
    if (!res.ok) throw new Error();
    toastAlert('Usuario actualizado', 'success');
    loadUsuarios();
  } catch (err) {
    toastAlert('No se pudo actualizar el usuario', 'danger');
  }
}
window.toggleUsuarioActivo = toggleUsuarioActivo;

// ===== FUNCIÓN PARA CARGAR MIS PAQUETES (CLIENTE/REPARTIDOR) =====
async function loadMisPaquetes() {
  const container = document.getElementById('misPaquetesList');
  if (!container) return;
  
  container.innerHTML = '<div class="text-muted"><i class="bi bi-arrow-clockwise"></i> Cargando mis paquetes…</div>';
  
  try {
    const res = await fetchAuth("/paquetes?limit=50");
    if (!res.ok) throw new Error();
    const paquetes = await res.json();
    
    if (!paquetes.length) {
      const mensaje = currentUser.rol === 'cliente' 
        ? {
            titulo: "No tienes paquetes",
            descripcion: "Aún no has comprado ningún paquete.",
            boton: "Comprar mi primer paquete"
          }
        : {
            titulo: "No tienes paquetes asignados",
            descripcion: "Aún no se te han asignado paquetes para entregar.",
            boton: "Volver al Dashboard"
          };
      
      container.innerHTML = `
        <div class="text-center p-5">
          <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
          <h5 class="mt-3">${mensaje.titulo}</h5>
          <p class="text-muted">${mensaje.descripcion}</p>
          <button class="btn btn-primary" onclick="showSection('${currentUser.rol === 'cliente' ? 'secRegistro' : 'secDashboard'}')">
            <i class="bi bi-${currentUser.rol === 'cliente' ? 'cart-plus' : 'bar-chart'}"></i> ${mensaje.boton}
          </button>
        </div>`;
      return;
    }
    
    const tituloSeccion = currentUser.rol === 'cliente' ? 'Mis Paquetes Comprados' : 'Mis Paquetes Asignados';
    
    container.innerHTML = `
      <h5 class="mb-3"><i class="bi bi-box"></i> ${tituloSeccion}</h5>
      <div class="row">
        ${paquetes.map(p => `
          <div class="col-md-6 col-lg-4 mb-3">
            <div class="card h-100">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0"><i class="bi bi-box"></i> ${p.codigo}</h6>
                ${pill(p.estado)}
              </div>
              <div class="card-body">
                <p><strong>Empresa:</strong> ${p.empresa}</p>
                <p><strong>Destinatario:</strong> ${p.destinatario}</p>
                <p><strong>Ubicación:</strong> ${p.ubicacion}</p>
                ${currentUser.rol === 'repartidor' ? `<p><strong>Cliente:</strong> ${p.cliente || 'N/A'}</p>` : ''}
                <button class="btn btn-outline-primary btn-sm" onclick="consultarPaqueteEspecifico('${p.codigo}')">
                  <i class="bi bi-search"></i> Ver detalles
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
  } catch (err) {
    container.innerHTML = '<div class="text-danger"><i class="bi bi-exclamation-triangle"></i> No se pudieron cargar tus paquetes.</div>';
  }
}

// ===== FUNCIÓN PARA CONSULTAR PAQUETE ESPECÍFICO =====
async function consultarPaqueteEspecifico(codigo) {
  try {
    const res = await fetchAuth(`/paquetes/${encodeURIComponent(codigo)}`);
    if (!res.ok) throw new Error();
    const paqueteData = await res.json();
    showHistoryModal(codigo, paqueteData);
  } catch (err) {
    toastAlert("No se pudo obtener la información del paquete", "danger");
  }
}
window.consultarPaqueteEspecifico = consultarPaqueteEspecifico;

// ===== FUNCIÓN PARA CARGAR PAQUETES DISPONIBLES PARA ASIGNACIÓN =====
async function loadPaquetesDisponibles() {
  const selectPaquete = document.querySelector('#formAsignar select[name="paquete_codigo"]');
  if (!selectPaquete) return;
  
  try {
    const res = await fetchAuth('/paquetes?limit=100');
    if (!res.ok) throw new Error();
    const paquetes = await res.json();
    
    // Filtrar paquetes que no están en estado "entregado" o "devuelto"
    const paquetesDisponibles = paquetes.filter(p => 
      !['entregado', 'devuelto'].includes(p.estado)
    );
    
    // Limpiar opciones existentes
    selectPaquete.innerHTML = '<option value="">Seleccionar paquete...</option>';
    
    // Agregar paquetes disponibles
    paquetesDisponibles.forEach(paquete => {
      const option = document.createElement('option');
      option.value = paquete.codigo;
      option.textContent = `${paquete.codigo} - ${paquete.destinatario} (${paquete.estado})`;
      selectPaquete.appendChild(option);
    });
    
    if (paquetesDisponibles.length === 0) {
      selectPaquete.innerHTML = '<option value="">No hay paquetes disponibles para asignar</option>';
      selectPaquete.disabled = true;
    }
  } catch (err) {
    selectPaquete.innerHTML = '<option value="">Error al cargar paquetes</option>';
    selectPaquete.disabled = true;
  }
}

// ===== FUNCIÓN PARA CARGAR REPARTIDORES DISPONIBLES =====
async function loadRepartidores() {
  const selectRepartidor = document.querySelector('#formAsignar select[name="repartidor_id"]');
  if (!selectRepartidor) return;
  
  try {
    const res = await fetchAuth('/repartidores');
    if (!res.ok) throw new Error();
    const repartidores = await res.json();
    
    // Limpiar opciones existentes
    selectRepartidor.innerHTML = '<option value="">Seleccionar repartidor...</option>';
    
    // Agregar repartidores disponibles
    repartidores.forEach(repartidor => {
      const option = document.createElement('option');
      option.value = repartidor.id;
      option.textContent = `${repartidor.nombre} (${repartidor.id})${repartidor.zona_id ? ` - ${repartidor.zona_id}` : ''}`;
      selectRepartidor.appendChild(option);
    });
    
    if (repartidores.length === 0) {
      selectRepartidor.innerHTML = '<option value="">No hay repartidores disponibles</option>';
      selectRepartidor.disabled = true;
    }
  } catch (err) {
    selectRepartidor.innerHTML = '<option value="">Error al cargar repartidores</option>';
    selectRepartidor.disabled = true;
  }
}