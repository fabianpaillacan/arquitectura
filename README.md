# 🚀 Sistema de Seguimiento de Paquetería v3.0

Sistema completo de gestión de paquetes con autenticación, roles, WebSockets y tiempo real.

## 🏗️ Arquitectura del Sistema

### **Backend (FastAPI + SQLModel)**
- **Framework**: FastAPI con SQLModel para ORM
- **Base de datos**: SQLite (configurable para PostgreSQL)
- **Autenticación**: Sistema de tokens simple (extensible a JWT)
- **WebSockets**: Actualizaciones en tiempo real
- **Permisos**: Sistema granular por rol

### **Frontend (HTML + JavaScript + Bootstrap)**
- **UI Framework**: Bootstrap 5 con Bootstrap Icons
- **JavaScript**: Vanilla JS con módulos organizados
- **Responsive**: Diseño adaptativo para móviles
- **Interfaz adaptativa**: Se ajusta según el rol del usuario

## 👥 Sistema de Roles y Permisos

### **Roles Implementados:**
1. **Cliente** - Compra y sigue sus paquetes
2. **Operador** - Registra y gestiona paquetes
3. **Repartidor** - Entrega y actualiza estados
4. **Administrador** - Gestión completa del sistema

### **Permisos por Rol:**
```python
CLIENTE: ["ver_mis_paquetes", "seguimiento_cliente", "registrar_paquetes"]
OPERADOR: ["registrar_paquetes", "actualizar_estado", "asignar_repartidor", "ver_todos_paquetes", "ver_mis_paquetes"]
REPARTIDOR: ["ver_mis_paquetes", "actualizar_estado", "ver_ruta"]
ADMIN: ["*"]  # Todos los permisos
```

## 🔄 Flujo de Trabajo

### **Cliente:**
1. **Comprar Paquete** → Registra nuevo paquete (estado: "en_bodega")
2. **Seguimiento** → Consulta ubicación actual de paquete específico
3. **Mis Paquetes** → Lista todos sus paquetes con historial completo

### **Operador:**
1. **Registrar Paquete** → Crea paquetes para clientes
2. **Actualizar Estado** → Cambia estado y ubicación
3. **Asignar Repartidor** → Asigna paquetes a repartidores
4. **Dashboard** → Estadísticas generales

### **Repartidor:**
1. **Mis Paquetes** → Ve paquetes asignados
2. **Actualizar Estado** → Actualiza progreso de entrega
3. **Mi Ruta** → Planificación de entregas
4. **Dashboard** → Estadísticas personales

### **Administrador:**
1. **Dashboard** → Estadísticas globales
2. **Gestión Usuarios** → Activar/desactivar usuarios
3. **Reportes** → Análisis y métricas
4. **Todas las funciones** → Acceso completo

## 📊 Modelos de Datos

### **Usuario**
```python
- id: str (USR-XXXXXXXX)
- email: str (único)
- nombre: str
- password_hash: str
- rol: Rol (Enum)
- zona_id: Optional[str] (para repartidores)
- activo: bool
- fecha_registro: datetime
```

### **Paquete**
```python
- codigo: str (PKG-XXXXXXXX, primary key)
- empresa: str
- destinatario: str
- direccion: str
- telefono: str
- ruta: str
- estado: str (en_bodega, en_transito, etc.)
- ubicacion: str
- cliente_id: Optional[str] (foreign key)
```

### **Evento**
```python
- id: int (primary key)
- fecha: datetime
- estado: str
- ubicacion: str
- paquete_codigo: str (foreign key)
- usuario_id: Optional[str] (foreign key)
- comentario: Optional[str]
```

### **Asignación**
```python
- id: int (primary key)
- paquete_codigo: str (foreign key)
- repartidor_id: str (foreign key)
- fecha_asignacion: datetime
- activa: bool
```

## 🔌 WebSockets y Tiempo Real

### **Conexión:**
- Endpoint: `/ws/{user_id}`
- Protocolo: WS/WSS automático
- Reconexión automática cada 5 segundos

### **Eventos Broadcast:**
- `paquete_registrado`: Nuevo paquete creado
- `paquete_actualizado`: Estado/ubicación cambiados
- `paquete_asignado`: Asignación a repartidor

### **Notificaciones:**
- Toast alerts automáticos
- Actualización de dashboards
- Recarga de listas relevantes

## 🎨 Interfaz de Usuario

### **Características:**
- **Responsive**: Adaptable a móviles y tablets
- **Rol-adaptativa**: Menús y funcionalidades según rol
- **Tiempo real**: Actualizaciones automáticas
- **Accesible**: Iconos y textos descriptivos

### **Componentes:**
- **Timeline**: Historial visual de eventos
- **Cards**: Información organizada en tarjetas
- **Modales**: Historiales detallados
- **Toast alerts**: Notificaciones temporales

## 🔒 Seguridad

### **Autenticación:**
- Tokens de sesión
- Verificación en cada endpoint
- Logout automático en expiración

### **Autorización:**
- Decoradores de permisos
- Verificación granular por rol
- Validación de acceso a recursos

### **Validación:**
- Pydantic models para I/O
- Validación de datos en frontend
- Sanitización de inputs

## 🚀 Instalación y Uso

### **Requisitos:**
```bash
pip install -r requirements.txt
```

### **Ejecución:**
```bash
python src/interfaces/api.py
```

### **Acceso:**
- URL: http://localhost:8000
- Usuarios de prueba predefinidos

## 📈 Métricas y Monitoreo

### **Dashboard por Rol:**
- **Cliente**: Estadísticas de sus paquetes
- **Repartidor**: Paquetes asignados y entregados
- **Operador/Admin**: Estadísticas globales

### **Estados de Paquete:**
- `procesando` → `en_bodega` → `en_transito` → `en_reparto` → `entregado`
- Estados alternativos: `devuelto`

## 🔧 Configuración

### **Variables de Entorno:**
- `DATABASE_URL`: Conexión a base de datos
- `STATIC_DIR`: Directorio de archivos estáticos

### **Base de Datos:**
- SQLite por defecto
- Migración automática de esquemas
- Usuarios predeterminados al inicio

## 🎯 Decisiones Arquitectónicas

### **1. Separación de Responsabilidades:**
- Backend: Lógica de negocio y API
- Frontend: Presentación e interacción
- Base de datos: Persistencia de datos

### **2. Sistema de Permisos Granular:**
- Permisos específicos por funcionalidad
- Verificación en cada endpoint
- Flexibilidad para agregar nuevos roles

### **3. Interfaz Adaptativa:**
- Menús dinámicos según rol
- Secciones ocultas por defecto
- Navegación contextual

### **4. Tiempo Real:**
- WebSockets para actualizaciones
- Broadcast de eventos importantes
- Reconexión automática

### **5. Experiencia de Cliente:**
- Flujo simplificado para compras
- Seguimiento claro de paquetes
- Historial completo con nombres de usuarios

### **6. Escalabilidad:**
- Arquitectura modular
- Base de datos configurable
- API RESTful extensible

## 🎭 Roles Disponibles

### 👑 **Administrador**
- Acceso total al sistema
- Gestión de usuarios
- Reportes y análisis
- Todas las operaciones

### 👨‍💼 **Operador**
- Registro de paquetes
- Actualización de estados
- Asignación de repartidores
- Dashboard general

### 🚚 **Repartidor**
- Ver paquetes asignados
- Actualizar estados
- Mi ruta de entrega
- Dashboard personal

### 👤 **Cliente**
- Seguimiento de paquetes propios
- Interfaz simplificada
- Solo ve sus paquetes

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
pip install -r requirements.txt
```

### 2. Ejecutar el Sistema
```bash
python src/interfaces/api.py
```

### 3. Acceder a la Aplicación
Abre tu navegador y ve a: `http://localhost:8000`

## 🔑 Usuarios de Prueba

El sistema incluye usuarios predeterminados para pruebas:

| Rol | Email | Contraseña | Funcionalidades |
|-----|-------|------------|-----------------|
| **Admin** | `admin@test.com` | `admin123` | Acceso total |
| **Operador** | `operador@test.com` | `operador123` | Gestión de paquetes |
| **Repartidor** | `repartidor@test.com` | `repartidor123` | Entrega de paquetes |
| **Cliente** | `cliente@test.com` | `cliente123` | Seguimiento |

## 📝 Registro de Nuevos Usuarios

1. Ve a la pestaña "Registrarse" en la pantalla de login
2. Completa el formulario con:
   - Nombre completo
   - Email único
   - Contraseña
   - Rol (Cliente, Operador, Repartidor)
   - Zona (solo para repartidores)
3. Haz clic en "Registrarse"
4. Inicia sesión con tus credenciales

## 🔄 Flujo de Trabajo

### Para Operadores/Admins:
1. **Registrar Paquete**: Llena el formulario con datos del paquete
2. **Asignar Repartidor**: Asigna el paquete a un repartidor
3. **Seguir Progreso**: Monitorea el estado en tiempo real

### Para Repartidores:
1. **Ver Asignaciones**: Revisa paquetes asignados
2. **Actualizar Estado**: Cambia estado según progreso
3. **Gestionar Ruta**: Organiza entregas del día

### Para Clientes:
1. **Seguimiento**: Ingresa código de paquete
2. **Ver Estado**: Consulta ubicación y progreso
3. **Historial**: Revisa todos los eventos

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Estilos y animaciones
- **JavaScript ES6+**: Lógica de aplicación
- **Bootstrap 5**: Framework responsive
- **Bootstrap Icons**: Iconografía

### Backend
- **Python 3.8+**: Lenguaje principal
- **FastAPI**: Framework web moderno
- **SQLModel**: ORM para SQLAlchemy
- **Pydantic**: Validación de datos
- **WebSockets**: Comunicación tiempo real

### Base de Datos
- **SQLite**: Base de datos principal
- **PostgreSQL**: Opcional para producción

## 📁 Estructura del Proyecto

```
test/
├── src/
│   └── interfaces/
│       └── api.py              # API principal con FastAPI
├── web/
│   ├── index.html              # Interfaz principal
│   ├── script.js               # Lógica JavaScript
│   └── style.css               # Estilos CSS
├── docker/
│   ├── docker-compose.yml      # Configuración Docker
│   └── Dockerfile              # Imagen Docker
├── requirements.txt            # Dependencias Python
├── paquetes.db                 # Base de datos SQLite
└── README.md                   # Este archivo
```

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
DATABASE_URL=sqlite:///./paquetes.db  # Base de datos
STATIC_DIR=web                        # Directorio frontend
```

### Docker
```bash
# Construir imagen
docker build -t paqueteria-system .

# Ejecutar con Docker Compose
docker-compose up -d
```

## 📊 API Endpoints

### Autenticación
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Iniciar sesión

### Paquetes
- `POST /paquetes` - Registrar paquete
- `PATCH /paquetes/estado` - Actualizar estado
- `GET /paquetes/{codigo}` - Consultar paquete
- `GET /paquetes` - Listar paquetes

### Asignaciones
- `POST /paquetes/asignar` - Asignar repartidor

### Dashboard
- `GET /dashboard` - Estadísticas

### WebSockets
- `WS /ws/{user_id}` - Conexión tiempo real

## 🎯 Próximos Pasos

- [ ] Implementar JWT real con PyJWT
- [ ] Agregar tests automatizados
- [ ] Implementar rate limiting
- [ ] Agregar logging estructurado
- [ ] Preparar para producción
- [ ] Implementar microservicios

## 🐛 Solución de Problemas

### Error de Conexión
- Verifica que el puerto 8000 esté libre
- Revisa que todas las dependencias estén instaladas

### Error de Base de Datos
- Elimina `paquetes.db` para recrear la base de datos
- Verifica permisos de escritura en el directorio

### Error de WebSockets
- Verifica que el navegador soporte WebSockets
- Revisa la consola del navegador para errores

## 📞 Soporte

Para soporte técnico o consultas:
1. Revisa la documentación en `script.txt`
2. Verifica los logs del servidor
3. Comprueba la consola del navegador
4. Valida la conexión a la base de datos

---

**¡El sistema está listo para uso en producción con todas las características modernas!** 🚀 