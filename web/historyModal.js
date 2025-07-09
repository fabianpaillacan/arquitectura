// ===== MODAL DE HISTORIAL DE PAQUETE =====
import { pill, getEventIcon } from './utils.js';

function createHistoryModal() {
  let modalEl = document.getElementById('historialModal');
  if (modalEl) return modalEl;
  modalEl = document.createElement('div');
  modalEl.className = 'modal fade';
  modalEl.id = 'historialModal';
  modalEl.tabIndex = -1;
  modalEl.setAttribute('aria-labelledby', 'historialModalLabel');
  modalEl.setAttribute('aria-hidden', 'true');
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

function showHistoryModal(codigo, paqueteData) {
  const modalEl = createHistoryModal();
  modalEl.querySelector('#histCode').textContent = codigo;
  const historialContent = modalEl.querySelector('#historialContent');
  if (paqueteData && paqueteData.eventos && paqueteData.eventos.length > 0) {
    const eventos = paqueteData.eventos;
    historialContent.innerHTML = `
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
    historialContent.innerHTML = `
      <div class="text-center p-5">
        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
        <h5 class="mt-3">Sin eventos registrados</h5>
        <p class="text-muted">No se encontraron eventos para este paquete.</p>
      </div>`;
  }
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}
window.showHistoryModal = showHistoryModal; 