import os
from datetime import timedelta

# Configuración JWT
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tu_clave_secreta_super_segura_cambiala_en_produccion")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "otra_clave_secreta_para_fastapi")
ALGORITHM = "HS256"

# Configuración de la aplicación
APP_NAME = "Sistema de Seguimiento de Paquetes"
APP_VERSION = "3.0.0"
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

# Configuración de base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./paquetes.db")

# Configuración de CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:3000",
]

# Configuración de WebSocket
WS_HEARTBEAT_INTERVAL = 30  # segundos 