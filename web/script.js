// script.js — lógica de frontend
// Backend FastAPI expone:
//   POST  /paquetes             → registrar
//   PATCH /paquetes/estado      → actualizar estado de un paquete
//   GET   /paquetes/{codigo}    → detalle + eventos
//   GET   /paquetes             → ?limit=N  → últimos paquetes (N por defecto = 5)
//   GET   /dashboard            → métricas agregadas
// ──────────────────────────────────────────────────────────
// utilidades breves
function toastAlert(msg, type = "info") {
  const placeholder = document.createElement("div");
  placeholder.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3" role="alert" style="z-index:1080;">${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
  document.body.appendChild(placeholder.firstElementChild);
  setTimeout(() => placeholder.remove(), 5000);
}

// helper → genera un HTML para un estado en "pill"
function pill(estado) {
  const map = {
    procesando: "info",
    en_bodega: "secondary",
    en_transito: "warning",
    en_reparto: "warning",
    entregado: "success",
    devuelto: "danger",
  };
  const cls = map[estado] || "secondary";
  return `<span class="badge bg-${cls} text-capitalize">${estado.replace("_", " ")}</span>`;
}

// navegación entre secciones
function showSection(id) {
  document.querySelectorAll("main section").forEach((sec) => {
    sec.classList.toggle("active", sec.id === id);
  });
  document.querySelectorAll("#navTabs .nav-link").forEach((lnk) => {
    lnk.classList.toggle("active", lnk.getAttribute("onclick").includes(id));
  });
  if (id === "secDashboard") loadDashboard();
  if (id === "secActualizar") loadRecentUpdates();
}
window.showSection = showSection;


// REGISTRAR PAQUETE
document.getElementById("formRegistro").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  try {
    const res = await fetch("/paquetes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    toastAlert(`Paquete registrado. Código: <strong>${data.codigo}</strong>`, "success");
    e.target.reset();
  } catch (err) {
    toastAlert("Error al registrar paquete", "danger");
  }
});

// ACTUALIZAR ESTADO

document.getElementById("formActualizar").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  try {
    const res = await fetch("/paquetes/estado", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
    toastAlert("Estado actualizado", "success");
    loadRecentUpdates();
  } catch (err) {
    toastAlert("No se pudo actualizar el paquete", "danger");
  }
});

// FUNCIÓN PARA CREAR EL MODAL DE HISTORIAL
function createHistoryModal() {
  // Verificar si el modal ya existe
  let modalEl = document.getElementById("historialModal");
  if (modalEl) {
    return modalEl;
  }

  // Crear el modal
  modalEl = document.createElement("div");
  modalEl.className = "modal fade";
  modalEl.id = "historialModal";
  modalEl.tabIndex = -1;
  modalEl.setAttribute("aria-labelledby", "historialModalLabel");
  modalEl.setAttribute("aria-hidden", "true");
  
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
  
  document.body.appendChild(modalEl);
  return modalEl;
}

// FUNCIÓN PARA MOSTRAR EL HISTORIAL
function showHistoryModal(codigo, paqueteData) {
  const modalEl = createHistoryModal();
  
  // Actualizar el código en el título
  modalEl.querySelector("#histCode").textContent = codigo;
  
  const historialContent = modalEl.querySelector("#historialContent");
  
  // Mostrar información del paquete y eventos
  if (paqueteData && paqueteData.eventos && paqueteData.eventos.length > 0) {
    const eventos = paqueteData.eventos;
    
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
              const fecha = new Date(evento.fecha);
              const isLatest = index === eventos.length - 1;
              
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
  } else {
    historialContent.innerHTML = `
      <div class="text-center p-5">
        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
        <h5 class="mt-3">Sin eventos registrados</h5>
        <p class="text-muted">No se encontraron eventos para este paquete.</p>
      </div>`;
  }
  
  // Mostrar el modal
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// FUNCIÓN AUXILIAR PARA OBTENER ICONOS DE EVENTOS
function getEventIcon(estado) {
  const iconMap = {
    procesando: 'arrow-clockwise',
    en_bodega: 'house',
    en_transito: 'truck',
    en_reparto: 'person-walking',
    entregado: 'check-circle',
    devuelto: 'arrow-return-left'
  };
  return iconMap[estado] || 'circle';
}

//  HISTORIAL  — Configurar el botón "Ver Historial" cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Buscar el botón de historial en el formulario de actualizar
  const historyBtn = document.querySelector("#formActualizar button.btn-outline-secondary");
  
  if (historyBtn) {
    historyBtn.addEventListener("click", async function(e) {
      e.preventDefault(); // Prevenir cualquier comportamiento por defecto
      
      const codeInput = document.querySelector("#formActualizar input[name='codigo']");
      const codigo = codeInput ? codeInput.value.trim() : '';
      
      if (!codigo) {
        toastAlert("Por favor, introduce el código de seguimiento primero", "warning");
        if (codeInput) codeInput.focus();
        return;
      }
      
      try {
        // Mostrar mensaje de carga
        toastAlert("Cargando historial...", "info");
        
        const res = await fetch(`/paquetes/${encodeURIComponent(codigo)}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            toastAlert("No se encontró ningún paquete con ese código", "warning");
          } else {
            throw new Error(`Error ${res.status}`);
          }
          return;
        }
        
        const paqueteData = await res.json();
        showHistoryModal(codigo, paqueteData);
        
      } catch (err) {
        console.error("Error al obtener el historial:", err);
        toastAlert("No se pudo obtener el historial del paquete. Verifique el código e intente nuevamente.", "danger");
      }
    });
  }
});

//  SEGUIMIENTO CLIENTE (del formulario principal)
document.getElementById("formCliente").addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = e.target.codigo.value.trim();
  const div = document.getElementById("clienteInfo");
  
  if (!code) {
    div.innerHTML = `<div class="alert alert-warning">Por favor, ingrese un código de seguimiento</div>`;
    return;
  }
  
  div.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary"></div><p class="mt-2">Buscando paquete...</p></div>';
  
  try {
    const res = await fetch(`/paquetes/${encodeURIComponent(code)}`);
    
    if (res.ok) {
        document.getElementById('actualizarMsg').innerText = 'Estado actualizado'; // Muestra éxito
        formActualizar.reset(); // Limpia el formulario
    } else {
      throw new Error(`Error ${res.status}`);
    }
  } catch (err) {
    console.error("Error al buscar paquete:", err);
    div.innerHTML = `<div class="alert alert-danger"><i class="bi bi-x-circle"></i> Error al buscar el paquete. Verifique el código e intente nuevamente.</div>`;
  }
});

//  ACTUALIZACIONES RECIENTES (panel derecho en secActualizar)
async function loadRecentUpdates() {
  const container = document.getElementById("recentUpdates");
  if (!container) return;
  
  container.innerHTML = "<div class='text-muted'><i class='bi bi-arrow-clockwise'></i> Cargando…</div>";
  
  try {
    const res = await fetch("/paquetes?limit=5");
    if (!res.ok) throw new Error();
    const data = await res.json();
    
    container.innerHTML = data.length
      ? data.map(p => `
          <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <div>
              <strong>${p.codigo}</strong><br />
              <small class="text-muted"><i class="bi bi-geo-alt"></i> ${p.destinatario} → ${p.ubicacion}</small>
            </div>
            ${pill(p.estado)}
          </div>`).join("")
      : `<div class='text-muted'><i class='bi bi-inbox'></i> Sin registros</div>`;
  } catch (err) {
    container.innerHTML = `<div class='text-danger'><i class='bi bi-exclamation-triangle'></i> No disponible</div>`;
  }
}


// DASHBOARD

async function loadDashboard() {
  const dash = document.getElementById("dashboardInfo");
  if (!dash) return;
  
  try {
    const res = await fetch("/dashboard");
    if (!res.ok) throw new Error();
    const d = await res.json();
    
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
    dash.innerHTML = `<div class='text-danger'><i class='bi bi-exclamation-triangle'></i> No se pudo cargar dashboard</div>`;
  }
}

// CARGA INICIAL
document.addEventListener('DOMContentLoaded', function() {
  loadRecentUpdates();
  loadDashboard();
});