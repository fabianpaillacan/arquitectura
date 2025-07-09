// ===== FUNCIONES UTILITARIAS GENERALES =====

// Crea y muestra alertas temporales en la esquina superior derecha de la pantalla
function toastAlert(msg, type = "info") {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3" role="alert" style="z-index:1080;">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  const toast = wrapper.firstElementChild;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 500);
  }, 5000);
}

// Convierte el estado del paquete en un badge visual con colores específicos
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

// Convierte el rol a texto legible
function rolToText(rol) {
  const roles = {
    cliente: "Cliente",
    operador: "Operador",
    repartidor: "Repartidor",
    admin: "Administrador"
  };
  return roles[rol] || rol;
}

// Retorna el icono de Bootstrap correspondiente a cada estado
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

// Exportar funciones para uso en otros módulos
export { toastAlert, pill, rolToText, getEventIcon }; 