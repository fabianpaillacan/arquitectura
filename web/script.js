function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active')); // Oculta todas las secciones
    document.getElementById(id).classList.add('active'); // Muestra la sección seleccionada
}

const API_URL = 'http://localhost:8000'; // URL base de la API backend

// Registrar paquete
const formRegistro = document.getElementById('formRegistro'); // Obtiene el formulario de registro
formRegistro.onsubmit = async function(e) {
    e.preventDefault(); // Evita que el formulario recargue la página
    const data = Object.fromEntries(new FormData(formRegistro)); // Obtiene los datos del formulario como objeto
    const body = {
        empresa: data.empresa,         // Nombre de la empresa que envía el paquete
        destinatario: data.destinatario, // Nombre del destinatario
        direccion: data.direccion,     // Dirección de entrega
        telefono: data.telefono,       // Teléfono del destinatario
        ruta: data.ruta                // Ruta de entrega
    };
    const res = await fetch(`${API_URL}/paquetes`, { // Envía los datos al backend para registrar el paquete
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
    if (res.ok) {
        const paquete = await res.json(); // Recibe el paquete registrado (incluye el código)
        document.getElementById('registroMsg').innerHTML = `Paquete registrado. Código: <b>${paquete.codigo}</b>`; // Muestra el código generado
        formRegistro.reset(); // Limpia el formulario
    } else {
        document.getElementById('registroMsg').innerText = 'Error al registrar paquete'; // Muestra error si falla
    }
}

// Actualizar estado
const formActualizar = document.getElementById('formActualizar'); // Obtiene el formulario de actualización
formActualizar.onsubmit = async function(e) {
    e.preventDefault(); // Evita recarga
    const data = Object.fromEntries(new FormData(formActualizar)); // Obtiene datos del formulario
    const body = {
        codigo: data.codigo,           // Código de seguimiento del paquete
        estado: data.estado,           // Nuevo estado seleccionado
        ubicacion: data.ubicacion      // Nueva ubicación
    };
    const res = await fetch(`${API_URL}/paquetes/estado`, { // Envía actualización al backend
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
    if (res.ok) {
        document.getElementById('actualizarMsg').innerText = 'Estado actualizado'; // Muestra éxito
        formActualizar.reset(); // Limpia el formulario
    } else {
        document.getElementById('actualizarMsg').innerText = 'Paquete no encontrado'; // Muestra error
    }
}

// Seguimiento cliente
const formCliente = document.getElementById('formCliente'); // Obtiene el formulario de consulta
formCliente.onsubmit = async function(e) {
    e.preventDefault(); // Evita recarga
    const data = Object.fromEntries(new FormData(formCliente)); // Obtiene código ingresado
    const res = await fetch(`${API_URL}/paquetes/${data.codigo}`); // Consulta el backend por el paquete
    if (!res.ok) {
        document.getElementById('clienteInfo').innerText = 'Paquete no encontrado'; // Muestra error si no existe
        return;
    }
    const paquete = await res.json(); // Recibe datos del paquete
    let eventos = paquete.eventos.map(ev => `<li>${new Date(ev.fecha).toLocaleString()}: ${ev.estado} (${ev.ubicacion})</li>`).join(''); // Lista de eventos
    document.getElementById('clienteInfo').innerHTML = `
        <b>Empresa:</b> ${paquete.empresa}<br>
        <b>Destinatario:</b> ${paquete.destinatario}<br>
        <b>Estado actual:</b> ${paquete.estado}<br>
        <b>Ubicación:</b> ${paquete.ubicacion}<br>
        <b>Eventos:</b><ul>${eventos}</ul>
    `; // Muestra la información y eventos
}

// Dashboard
async function renderDashboard() {
    const res = await fetch(`${API_URL}/dashboard`); // Consulta el backend por el resumen
    if (!res.ok) return;
    const data = await res.json(); // Recibe datos del dashboard
    document.getElementById('dashboardInfo').innerHTML = `
        <b>Total paquetes:</b> ${data.total}<br>
        <b>En bodega:</b> ${data.en_bodega}<br>
        <b>En tránsito:</b> ${data.en_transito}<br>
        <b>Entregados:</b> ${data.entregado}<br>
    `; // Muestra el resumen
}
setInterval(renderDashboard, 1000); // Actualiza el dashboard cada segundo
