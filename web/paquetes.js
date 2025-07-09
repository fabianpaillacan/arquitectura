// ===== PAQUETES: REGISTRO, CONSULTA Y ASIGNACIÓN =====
import { toastAlert, pill, getEventIcon } from './utils.js';
import { fetchAuth } from './auth.js';

async function loadMisPaquetes() {
  const container = document.getElementById('misPaquetesList');
  if (!container) return;
  container.innerHTML = '<div class="text-muted"><i class="bi bi-arrow-clockwise"></i> Cargando mis paquetes…</div>';
  try {
    const res = await fetchAuth('/paquetes?limit=50');
    if (!res.ok) throw new Error();
    const paquetes = await res.json();
    if (!paquetes.length) {
      const mensaje = window.currentUser.rol === 'cliente'
        ? { titulo: 'No tienes paquetes', descripcion: 'Aún no has comprado ningún paquete.', boton: 'Comprar mi primer paquete' }
        : { titulo: 'No tienes paquetes asignados', descripcion: 'Aún no se te han asignado paquetes para entregar.', boton: 'Volver al Dashboard' };
      container.innerHTML = `
        <div class="text-center p-5">
          <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
          <h5 class="mt-3">${mensaje.titulo}</h5>
          <p class="text-muted">${mensaje.descripcion}</p>
          <button class="btn btn-primary" onclick="showSection('${window.currentUser.rol === 'cliente' ? 'secRegistro' : 'secDashboard'}')">
            <i class="bi bi-${window.currentUser.rol === 'cliente' ? 'cart-plus' : 'bar-chart'}"></i> ${mensaje.boton}
          </button>
        </div>`;
      return;
    }
    const tituloSeccion = window.currentUser.rol === 'cliente' ? 'Mis Paquetes Comprados' : 'Mis Paquetes Asignados';
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
                ${window.currentUser.rol === 'repartidor' ? `<p><strong>Cliente:</strong> ${p.cliente || 'N/A'}</p>` : ''}
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
window.loadMisPaquetes = loadMisPaquetes;

async function consultarPaqueteEspecifico(codigo) {
  try {
    const res = await fetchAuth(`/paquetes/${encodeURIComponent(codigo)}`);
    if (!res.ok) throw new Error();
    const paqueteData = await res.json();
    window.showHistoryModal(codigo, paqueteData);
  } catch (err) {
    toastAlert('No se pudo obtener la información del paquete', 'danger');
  }
}
window.consultarPaqueteEspecifico = consultarPaqueteEspecifico;

async function loadPaquetesDisponibles() {
  const selectPaquete = document.querySelector('#formAsignar select[name="paquete_codigo"]');
  if (!selectPaquete) return;
  try {
    const res = await fetchAuth('/paquetes?limit=100');
    if (!res.ok) throw new Error();
    const paquetes = await res.json();
    const paquetesDisponibles = paquetes.filter(p => !['entregado', 'devuelto'].includes(p.estado));
    selectPaquete.innerHTML = '<option value="">Seleccionar paquete...</option>';
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
window.loadPaquetesDisponibles = loadPaquetesDisponibles;

async function loadRepartidores() {
  const selectRepartidor = document.querySelector('#formAsignar select[name="repartidor_id"]');
  if (!selectRepartidor) return;
  try {
    const res = await fetchAuth('/repartidores');
    if (!res.ok) throw new Error();
    const repartidores = await res.json();
    selectRepartidor.innerHTML = '<option value="">Seleccionar repartidor...</option>';
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
window.loadRepartidores = loadRepartidores;

// Mostrar información de paquete (para seguimiento cliente)
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
window.mostrarInformacionPaquete = mostrarInformacionPaquete; 