# 🚚 Sistema de Seguimiento de Paquetería

Sistema web completo para gestión y seguimiento de paquetes con interfaz moderna y API REST.

## 🚀 Características

- ✅ **Registro de paquetes** con código único automático
- ✅ **Actualización de estados** en tiempo real
- ✅ **Seguimiento para clientes** con historial completo
- ✅ **Dashboard** con métricas y estadísticas
- ✅ **Timeline visual** del historial de cambios
- ✅ **Interfaz responsive** para móviles y desktop
- ✅ **API REST** completa con FastAPI
- ✅ **Base de datos SQLite** (configurable para PostgreSQL)

## 📋 Requisitos

- Python 3.8+
- pip (gestor de paquetes)

## 🛠️ Instalación

1. **Clonar el repositorio:**
```bash
git clone <url-del-repositorio>
cd sistema-paquetes
```

2. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

## 🚀 Ejecución

### Opción 1: Ejecutar directamente
```bash
python main.py
```

### Opción 2: Usar uvicorn
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Opción 3: Usar Docker (si está configurado)
```bash
docker-compose up
```

## 🌐 Acceso a la aplicación

Una vez ejecutada, la aplicación estará disponible en:

- **Frontend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **API Health:** http://localhost:8000/health

## 📁 Estructura del proyecto

```
sistema-paquetes/
├── main.py                 # Archivo principal de ejecución
├── requirements.txt        # Dependencias de Python
├── paquetes.db            # Base de datos SQLite
├── web/                   # Frontend estático
│   ├── index.html         # Página principal
│   ├── style.css          # Estilos CSS
│   └── script.js          # Lógica JavaScript
├── src/                   # Backend Python
│   ├── interfaces/
│   │   └── api.py         # API FastAPI
│   ├── models.py          # Modelos de datos
│   └── db.py              # Configuración de BD
└── docker/                # Configuración Docker
    ├── Dockerfile
    └── docker-compose.yml
```

## 🔧 API Endpoints

### Paquetes
- `POST /paquetes` - Registrar nuevo paquete
- `GET /paquetes/{codigo}` - Consultar paquete específico
- `GET /paquetes?limit=N` - Listar paquetes recientes
- `PATCH /paquetes/estado` - Actualizar estado de paquete

### Dashboard
- `GET /dashboard` - Obtener métricas agregadas

### Sistema
- `GET /health` - Estado del sistema

## 🎨 Funcionalidades del Frontend

### 1. Registro de Paquetes
- Formulario completo con validación
- Generación automática de código único
- Información de empresa, destinatario, dirección, etc.

### 2. Actualización de Estados
- Cambio de estado con ubicación
- Historial completo de cambios
- Modal con timeline visual

### 3. Seguimiento para Clientes
- Búsqueda por código de seguimiento
- Información detallada del paquete
- Tabla de eventos históricos

### 4. Dashboard
- Métricas en tiempo real
- Contadores por estado
- Actualizaciones automáticas

## 🗄️ Base de Datos

La aplicación usa SQLite por defecto, pero puede configurarse para PostgreSQL:

```bash
# Configurar variable de entorno para PostgreSQL
export DATABASE_URL="postgresql://user:password@localhost/dbname"
```

## 🔍 Solución de Problemas

### Error: "Module not found"
```bash
pip install -r requirements.txt
```

### Error: "Port already in use"
```bash
# Cambiar puerto
python main.py --port 8001
```

### Error: "Database locked"
```bash
# Eliminar archivo de BD y reiniciar
rm paquetes.db
python main.py
```

## 🧪 Testing

```bash
# Ejecutar tests
pytest

# Con cobertura
pytest --cov=src
```

## 📝 Desarrollo

### Formateo de código
```bash
black src/ web/
flake8 src/
```

### Linting
```bash
mypy src/
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

Sistema de Seguimiento de Paquetería - Desarrollado con FastAPI y Bootstrap 5 