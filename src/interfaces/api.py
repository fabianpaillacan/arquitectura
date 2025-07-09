from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlmodel import SQLModel, Field, Session, create_engine, select
from sqlalchemy import func, desc, text
from typing import List, Optional
from datetime import datetime
import uuid, os, json, asyncio
from enum import Enum
from fastapi import status
import functools
from src.auth.jwt_handler import jwt_handler
from src.config import DATABASE_URL, ALLOWED_ORIGINS


#  CONFIG BD (SQLite por defecto, Postgres opcional) 
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

# MODELOS ORM (SQLModel)  
class Rol(Enum):
    CLIENTE = "cliente"
    OPERADOR = "operador"
    REPARTIDOR = "repartidor"
    ADMIN = "admin"

class Usuario(SQLModel, table=True):
    id: str = Field(primary_key=True, default_factory=lambda: f"USR-{uuid.uuid4().hex[:8].upper()}")
    email: str = Field(unique=True, index=True)
    nombre: str
    password_hash: str
    rol: Rol
    zona_id: Optional[str] = Field(default=None)  # Para repartidores
    activo: bool = True
    fecha_registro: datetime = Field(default_factory=datetime.utcnow)

class AsignacionPaquete(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    paquete_codigo: str = Field(foreign_key="paquete.codigo")
    repartidor_id: str = Field(foreign_key="usuario.id")
    fecha_asignacion: datetime = Field(default_factory=datetime.utcnow)
    activa: bool = True

class Evento(SQLModel, table=True): # Tabla de eventos
    id: int | None = Field(default=None, primary_key=True) # ID del evento
    fecha: datetime = Field(default_factory=datetime.utcnow) # Fecha del evento
    estado: str # Estado del paquete
    ubicacion: str # Ubicación del paquete
    paquete_codigo: str = Field(foreign_key="paquete.codigo") # Código del paquete
    usuario_id: Optional[str] = Field(default=None, foreign_key="usuario.id") # ID del usuario que realizó el evento
    comentario: Optional[str] = Field(default=None) # Comentario del evento

class Paquete(SQLModel, table=True):
    codigo: str = Field(primary_key=True, index=True)
    empresa: str
    destinatario: str
    direccion: str
    telefono: str
    ruta: str
    estado: str = "en_bodega"
    ubicacion: str = "Bodega"
    cliente_id: Optional[str] = Field(default=None, foreign_key="usuario.id")


#   ESQUEMAS Pydantic (I/O)       
class UsuarioCreate(BaseModel):
    email: str
    nombre: str
    password: str
    rol: Rol
    zona_id: Optional[str] = None

class UsuarioLogin(BaseModel):
    email: str
    password: str

class UsuarioRead(BaseModel):
    id: str
    email: str
    nombre: str
    rol: Rol
    zona_id: Optional[str] = None

class EventoRead(BaseModel):
    estado: str
    ubicacion: str
    fecha: datetime
    usuario_id: Optional[str] = None
    comentario: Optional[str] = None

class PaqueteRead(BaseModel):
    codigo: str
    empresa: str
    destinatario: str
    direccion: str
    telefono: str
    ruta: str
    estado: str
    ubicacion: str
    cliente_id: Optional[str] = None
    eventos: List[EventoRead]

class PaqueteCreate(BaseModel):
    empresa: str
    destinatario: str
    direccion: str
    telefono: str
    ruta: str

class PaqueteUpdateEstado(BaseModel):
    codigo: str
    estado: str
    ubicacion: str
    comentario: Optional[str] = None

class AsignacionCreate(BaseModel):
    paquete_codigo: str
    repartidor_id: str

#  DEPENDENCIAS & UTILIDADES     
def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

def hash_password(password: str) -> str:
    # Usar bcrypt para hash seguro
    return jwt_handler.get_password_hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return jwt_handler.verify_password(password, hashed)

def build_paquete_read(paquete: Paquete, session: Session) -> PaqueteRead:
    # Obtener todos los usuarios para mapear id->nombre
    usuarios = {u.id: u.nombre for u in session.exec(select(Usuario)).all()}
    eventos = (
        session.exec(
            select(Evento)
            .where(Evento.paquete_codigo == paquete.codigo)
            .order_by(desc("fecha"))
        ).all()
    )
    return PaqueteRead(
        codigo=paquete.codigo,
        empresa=paquete.empresa,
        destinatario=paquete.destinatario,
        direccion=paquete.direccion,
        telefono=paquete.telefono,
        ruta=paquete.ruta,
        estado=paquete.estado,
        ubicacion=paquete.ubicacion,
        cliente_id=paquete.cliente_id,
        eventos=[
            EventoRead(
                estado=e.estado, 
                ubicacion=e.ubicacion, 
                fecha=e.fecha,
                usuario_id=e.usuario_id,
                comentario=(usuarios.get(e.usuario_id) if e.usuario_id else None)  # Usar comentario para nombre de usuario
            )
            for e in eventos
        ],
    )

#   APP FastAPI                   ║
app = FastAPI(title="Seguimiento de Paquetería API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_db_and_tables()

# ===== CREAR USUARIOS PREDETERMINADOS =====
def create_default_users():
    with Session(engine) as session:
        # Verificar si ya existen usuarios
        existing_users = session.exec(select(Usuario)).all()
        if existing_users:
            return 
        
        # Crear usuarios predeterminados
        default_users = [
            {
                "email": "admin@test.com",
                "nombre": "Administrador",
                "password": "admin123",
                "rol": Rol.ADMIN
            },
            {
                "email": "operador@test.com", 
                "nombre": "Operador",
                "password": "operador123",
                "rol": Rol.OPERADOR
            },
            {
                "email": "repartidor@test.com",
                "nombre": "Repartidor",
                "password": "repartidor123", 
                "rol": Rol.REPARTIDOR,
                "zona_id": "Zona Centro"
            },
            {
                "email": "cliente@test.com",
                "nombre": "Cliente",
                "password": "cliente123",
                "rol": Rol.CLIENTE
            }
        ]
        
        for user_data in default_users:
            user = Usuario(
                email=user_data["email"],
                nombre=user_data["nombre"],
                password_hash=hash_password(user_data["password"]),
                rol=user_data["rol"],
                zona_id=user_data.get("zona_id")
            )
            session.add(user)
        
        session.commit()
        print("✅ Usuarios predeterminados creados exitosamente")

# Crear usuarios predeterminados al iniciar
create_default_users()

# ===== ENDPOINTS DE AUTENTICACIÓN =====
class RefreshTokenRequest(BaseModel):
    refresh_token: str

@app.post("/auth/refresh")
def refresh_token(data: RefreshTokenRequest, session: Session = Depends(get_session)):
    """Refresca el token de acceso usando un refresh token"""
    payload = jwt_handler.verify_token(data.refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token inválido")
    
    user_id = payload.get("sub")
    user = session.get(Usuario, user_id)
    
    if not user or not user.activo:
        raise HTTPException(status_code=401, detail="Usuario no válido")
    
    # Generar nuevo access token
    access_token_data = {
        "sub": user.id,
        "email": user.email,
        "nombre": user.nombre,
        "rol": user.rol.value
    }
    
    new_access_token = jwt_handler.create_access_token(access_token_data)
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@app.post("/auth/register", response_model=UsuarioRead)
def registrar_usuario(data: UsuarioCreate, session: Session = Depends(get_session)):
    # Verificar si el email ya existe
    existing_user = session.exec(select(Usuario).where(Usuario.email == data.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    # Crear nuevo usuario
    user = Usuario(
        email=data.email,
        nombre=data.nombre,
        password_hash=hash_password(data.password),
        rol=data.rol,
        zona_id=data.zona_id
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return UsuarioRead(
        id=user.id,
        email=user.email,
        nombre=user.nombre,
        rol=user.rol,
        zona_id=user.zona_id
    )

@app.post("/auth/login")
def login(data: UsuarioLogin, session: Session = Depends(get_session)):
    user = session.exec(select(Usuario).where(Usuario.email == data.email)).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not user.activo:
        raise HTTPException(status_code=401, detail="Usuario inactivo")
    
    # Generar tokens JWT
    access_token_data = {
        "sub": user.id,
        "email": user.email,
        "nombre": user.nombre,
        "rol": user.rol.value
    }
    
    access_token = jwt_handler.create_access_token(access_token_data)
    refresh_token = jwt_handler.create_refresh_token({"sub": user.id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UsuarioRead(
            id=user.id,
            email=user.email,
            nombre=user.nombre,
            rol=user.rol,
            zona_id=user.zona_id
        )
    }

# ===== GESTIÓN DE WEBSOCKETS =====
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: dict = {}  # {user_id: [websocket1, websocket2]}

    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: Optional[str] = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def broadcast(self, message: dict):
        """Envía mensaje a todas las conexiones activas"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                # Remover conexiones cerradas
                self.active_connections.remove(connection)

    async def send_to_user(self, user_id: str, message: dict):
        """Envía mensaje solo a un usuario específico"""
        if user_id in self.user_connections:
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    # Remover conexiones cerradas
                    self.user_connections[user_id].remove(connection)

manager = ConnectionManager()

# ===== AUTENTICACIÓN Y AUTORIZACIÓN =====
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), session: Session = Depends(get_session)) -> Usuario:
    # Verificar y decodificar token JWT
    token = credentials.credentials
    payload = jwt_handler.verify_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = session.get(Usuario, user_id)
    if not user or not user.activo:
        raise HTTPException(status_code=401, detail="Usuario no válido")
    
    return user

def verificar_permiso(permiso_requerido: str):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, usuario: Usuario = Depends(get_current_user), **kwargs):
            if not tiene_permiso(usuario, permiso_requerido):
                raise HTTPException(status_code=403, detail="Permiso denegado")
            return await func(*args, usuario=usuario, **kwargs)
        return wrapper
    return decorator

def tiene_permiso(usuario: Usuario, permiso: str) -> bool:
    permisos_por_rol = {
        Rol.CLIENTE: ["ver_mis_paquetes", "seguimiento_cliente", "registrar_paquetes"],
        Rol.OPERADOR: ["registrar_paquetes", "actualizar_estado", "asignar_repartidor", "ver_todos_paquetes", "ver_mis_paquetes"],
        Rol.REPARTIDOR: ["ver_mis_paquetes", "actualizar_estado", "ver_ruta", "ver_todos_paquetes"],
        Rol.ADMIN: ["*"]  # Todos los permisos
    }
    
    if usuario.rol == Rol.ADMIN:
        return True
    
    return permiso in permisos_por_rol.get(usuario.rol, [])

# ===== ENDPOINTS DE PAQUETES =====
@app.post("/paquetes", response_model=PaqueteRead)
@verificar_permiso("registrar_paquetes")
async def registrar_paquete(data: PaqueteCreate, usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    codigo = f"PKG-{uuid.uuid4().hex[:8].upper()}"
    paquete = Paquete(
        codigo=codigo, 
        **data.model_dump(),
        cliente_id=usuario.id if usuario.rol == Rol.CLIENTE else None
    )
    
    # Crear evento inicial
    evento = Evento(
        estado="en_bodega", 
        ubicacion="Bodega", 
        paquete_codigo=codigo,
        usuario_id=usuario.id,
        comentario="Paquete registrado"
    )
    
    session.add_all([paquete, evento])
    session.commit()
    
    # Notificar por WebSocket
    paquete_read = build_paquete_read(paquete, session)
    asyncio.create_task(manager.broadcast({
        "type": "paquete_registrado",
        "paquete": paquete_read.model_dump()
    }))
    
    return paquete_read

@app.patch("/paquetes/estado", response_model=PaqueteRead)
@verificar_permiso("actualizar_estado")
async def actualizar_estado(data: PaqueteUpdateEstado, usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    print("ACTUALIZAR ESTADO:", data.codigo, usuario.id, usuario.rol)
    paquete = session.get(Paquete, data.codigo)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    
    # Verificar permisos específicos
    if usuario.rol == Rol.REPARTIDOR:
        # Repartidor solo puede actualizar paquetes asignados
        asignacion = session.exec(
            select(AsignacionPaquete)
            .where(AsignacionPaquete.paquete_codigo == data.codigo)
            .where(AsignacionPaquete.repartidor_id == usuario.id)
            .where(AsignacionPaquete.activa == True)
        ).first()
        if not asignacion:
            raise HTTPException(status_code=403, detail="No tienes asignado este paquete")
    
    paquete.estado = data.estado
    paquete.ubicacion = data.ubicacion
    
    # Crear nuevo evento
    evento = Evento(
        estado=data.estado, 
        ubicacion=data.ubicacion, 
        paquete_codigo=paquete.codigo,
        usuario_id=usuario.id,
        comentario=data.comentario
    )
    
    session.add(evento)
    session.commit()
    
    # Notificar por WebSocket
    paquete_read = build_paquete_read(paquete, session)
    asyncio.create_task(manager.broadcast({
        "type": "paquete_actualizado",
        "paquete": paquete_read.model_dump(),
        "usuario": usuario.nombre
    }))
    
    return paquete_read

@app.get("/paquetes/{codigo}", response_model=PaqueteRead)
@verificar_permiso("ver_mis_paquetes")
async def consultar_paquete(codigo: str, usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    paquete = session.get(Paquete, codigo)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    
    # Verificar permisos específicos
    if usuario.rol == Rol.CLIENTE and paquete.cliente_id != usuario.id:
        raise HTTPException(status_code=403, detail="No puedes ver este paquete")
    
    return build_paquete_read(paquete, session)

@app.get("/paquetes")
@verificar_permiso("ver_mis_paquetes")
async def listar_paquetes(limit: int = 5, usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    if usuario.rol == Rol.CLIENTE:
        paquetes = session.exec(
            select(Paquete)
            .where(Paquete.cliente_id == usuario.id)
            .order_by(desc("codigo"))
            .limit(limit)
        ).all()
    elif usuario.rol == Rol.REPARTIDOR:
        asignaciones = session.exec(
            select(AsignacionPaquete.paquete_codigo)
            .where(AsignacionPaquete.repartidor_id == usuario.id)
            .where(AsignacionPaquete.activa == True)
        ).all()
        asignaciones = list(asignaciones)
        print("ASIGNACIONES REPARTIDOR:", asignaciones)
        if asignaciones:
            paquetes = session.exec(
                select(Paquete)
                .where(Paquete.codigo.in_(asignaciones))
                .order_by(desc(Paquete.codigo))
                .limit(limit)
            ).all()
        else:
            paquetes = []
    else:
        paquetes = session.exec(
            select(Paquete)
            .order_by(desc("codigo"))
            .limit(limit)
        ).all()
    # Obtener nombres de clientes
    clientes = {u.id: u.nombre for u in session.exec(select(Usuario)).all()}
    return [
        {
            "codigo": p.codigo,
            "empresa": p.empresa,
            "destinatario": p.destinatario,
            "estado": p.estado,
            "ubicacion": p.ubicacion,
            "cliente": clientes.get(p.cliente_id) if p.cliente_id else None
        }
        for p in paquetes
    ]

# ===== ENDPOINTS DE ASIGNACIÓN =====
@app.post("/paquetes/asignar")
@verificar_permiso("asignar_repartidor")
async def asignar_paquete(data: AsignacionCreate, usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    # Verificar que el paquete existe
    paquete = session.get(Paquete, data.paquete_codigo)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    
    # Verificar que el repartidor existe y es repartidor
    repartidor = session.get(Usuario, data.repartidor_id)
    if not repartidor or repartidor.rol != Rol.REPARTIDOR:
        raise HTTPException(status_code=404, detail="Repartidor no válido")
    
    # Desactivar asignaciones previas
    asignaciones_previas = session.exec(
        select(AsignacionPaquete)
        .where(AsignacionPaquete.paquete_codigo == data.paquete_codigo)
        .where(AsignacionPaquete.activa == True)
    ).all()
    for asignacion in asignaciones_previas:
        asignacion.activa = False
    
    # Crear nueva asignación
    asignacion = AsignacionPaquete(
        paquete_codigo=data.paquete_codigo,
        repartidor_id=data.repartidor_id
    )
    session.add(asignacion)
    session.commit()
    
    # Notificar por WebSocket
    asyncio.create_task(manager.send_to_user(data.repartidor_id, {
        "type": "paquete_asignado",
        "paquete_codigo": data.paquete_codigo,
        "asignado_por": usuario.nombre
    }))
    
    return {"message": "Paquete asignado exitosamente"}

@app.get("/dashboard")
@verificar_permiso("ver_mis_paquetes")
async def dashboard(usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    """Dashboard según el rol del usuario"""
    if usuario.rol == Rol.CLIENTE:
        # Cliente ve solo sus estadísticas
        total = session.exec(
            select(func.count())
            .where(Paquete.cliente_id == usuario.id)
        ).one()
        en_bodega = session.exec(
            select(func.count())
            .where(Paquete.cliente_id == usuario.id)
            .where(Paquete.estado == "en_bodega")
        ).one()
        en_transito = session.exec(
            select(func.count())
            .where(Paquete.cliente_id == usuario.id)
            .where(Paquete.estado == "en_transito")
        ).one()
        entregado = session.exec(
            select(func.count())
            .where(Paquete.cliente_id == usuario.id)
            .where(Paquete.estado == "entregado")
        ).one()
    elif usuario.rol == Rol.REPARTIDOR:
        # Repartidor ve solo paquetes asignados
        # Obtener códigos de paquetes asignados al repartidor
        asignaciones = session.exec(
            select(AsignacionPaquete.paquete_codigo)
            .where(AsignacionPaquete.repartidor_id == usuario.id)
            .where(AsignacionPaquete.activa == True)
        ).all()
        
        if asignaciones:
            # Contar paquetes asignados
            total = len(asignaciones)
            en_bodega = session.exec(
                select(func.count()).select_from(Paquete)
                .where(Paquete.estado == "en_bodega")
                .where(Paquete.codigo.in_(asignaciones))
            ).one()
            en_transito = session.exec(
                select(func.count()).select_from(Paquete)
                .where(Paquete.estado == "en_transito")
                .where(Paquete.codigo.in_(asignaciones))
            ).one()
            entregado = session.exec(
                select(func.count()).select_from(Paquete)
                .where(Paquete.estado == "entregado")
                .where(Paquete.codigo.in_(asignaciones))
            ).one()
        else:
            total = en_bodega = en_transito = entregado = 0
    else:
        # Operador y Admin ven todas las estadísticas
        total = session.exec(select(func.count()).select_from(Paquete)).one()
        en_bodega = session.exec(
            select(func.count()).where(Paquete.estado == "en_bodega")
        ).one()
        en_transito = session.exec(
            select(func.count()).where(Paquete.estado == "en_transito")
        ).one()
        entregado = session.exec(
            select(func.count()).where(Paquete.estado == "entregado")
        ).one()
    
    return {
        "total": total,
        "en_bodega": en_bodega,
        "en_transito": en_transito,
        "entregado": entregado,
    }

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow()}

# Endpoint para listar repartidores disponibles
print("DEBUG: DEFINIENDO ENDPOINT /repartidores")
@app.get("/repartidores")
@verificar_permiso("asignar_repartidor")
async def listar_repartidores(usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    """Lista todos los repartidores activos para asignación"""
    repartidores = session.exec(
        select(Usuario)
        .where(Usuario.rol == Rol.REPARTIDOR)
        .where(Usuario.activo == True)
        .order_by(Usuario.nombre)
    ).all()
    
    return [
        {
            "id": r.id,
            "nombre": r.nombre,
            "email": r.email,
            "zona_id": r.zona_id
        }
        for r in repartidores
    ]

# Endpoint para listar todos los usuarios (solo admin)
@app.get("/usuarios")
@verificar_permiso("*")
async def listar_usuarios(usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    usuarios = session.exec(select(Usuario)).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "nombre": u.nombre,
            "rol": u.rol.value if isinstance(u.rol, Enum) else u.rol,
            "activo": u.activo
        }
        for u in usuarios
    ]

# Endpoint para activar/desactivar usuario
class UsuarioActivoUpdate(BaseModel):
    activo: bool

@app.patch("/usuarios/{user_id}/activo", status_code=status.HTTP_204_NO_CONTENT)
@verificar_permiso("*")
async def actualizar_usuario_activo(user_id: str, data: UsuarioActivoUpdate, usuario: Usuario = Depends(get_current_user), session: Session = Depends(get_session)):
    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.activo = data.activo
    session.add(user)
    session.commit()
    return

# ===== WEBSOCKET ENDPOINT =====
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Mantener conexión activa
            data = await websocket.receive_text()
            # Opcional: procesar mensajes del cliente
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# Servir archivos estáticos (frontend) - DEBE IR AL FINAL
print("DEBUG: MOUNT STATIC")
static_dir = os.environ.get("STATIC_DIR", "web")
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    import asyncio
    uvicorn.run(app, host="0.0.0.0", port=8000)
