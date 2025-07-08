from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import SQLModel, Field, Session, create_engine, select
from sqlalchemy import func
from typing import List
from datetime import datetime
import uuid, os


#  CONFIG BD (SQLite por defecto, Postgres opcional) 
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./paquetes.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

# MODELOS ORM (SQLModel)  
class Evento(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    fecha: datetime = Field(default_factory=datetime.utcnow)
    estado: str
    ubicacion: str
    paquete_codigo: str = Field(foreign_key="paquete.codigo")

class Paquete(SQLModel, table=True):
    codigo: str = Field(primary_key=True, index=True)
    empresa: str
    destinatario: str
    direccion: str
    telefono: str
    ruta: str
    estado: str = "en_bodega"
    ubicacion: str = "Bodega"


#   ESQUEMAS Pydantic (I/O)       
class EventoRead(BaseModel):
    estado: str
    ubicacion: str
    fecha: datetime

class PaqueteRead(BaseModel):
    codigo: str
    empresa: str
    destinatario: str
    direccion: str
    telefono: str
    ruta: str
    estado: str
    ubicacion: str
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

#  DEPENDENCIAS & UTILIDADES     
def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

def build_paquete_read(paquete: Paquete, session: Session) -> PaqueteRead:
    eventos = (
        session.exec(
            select(Evento)
            .where(Evento.paquete_codigo == paquete.codigo)
            .order_by(Evento.fecha)
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
        eventos=[
            EventoRead(estado=e.estado, ubicacion=e.ubicacion, fecha=e.fecha)
            for e in eventos
        ],
    )

#   APP FastAPI                   ║
app = FastAPI(title="Seguimiento de Paquetería API", version="2.2.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_db_and_tables()

# ───────────── Endpoints ─────────────
@app.post("/paquetes", response_model=PaqueteRead)
def registrar_paquete(data: PaqueteCreate, session: Session = Depends(get_session)):
    codigo = f"PKG-{uuid.uuid4().hex[:8].upper()}"
    paquete = Paquete(codigo=codigo, **data.model_dump())
    session.add_all([
        paquete,
        Evento(estado="en_bodega", ubicacion="Bodega", paquete_codigo=codigo),
    ])
    session.commit()
    return build_paquete_read(paquete, session)

@app.patch("/paquetes/estado", response_model=PaqueteRead)
def actualizar_estado(data: PaqueteUpdateEstado, session: Session = Depends(get_session)):
    paquete = session.get(Paquete, data.codigo)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    paquete.estado, paquete.ubicacion = data.estado, data.ubicacion
    session.add(
        Evento(
            estado=data.estado, ubicacion=data.ubicacion, paquete_codigo=paquete.codigo
        )
    )
    session.commit()
    return build_paquete_read(paquete, session)

@app.get("/paquetes/{codigo}", response_model=PaqueteRead)
def consultar_paquete(codigo: str, session: Session = Depends(get_session)):
    paquete = session.get(Paquete, codigo)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return build_paquete_read(paquete, session)

@app.get("/paquetes")
def listar_paquetes(limit: int = 5, session: Session = Depends(get_session)):
    """Obtiene una lista de paquetes recientes."""
    paquetes = session.exec(
        select(Paquete).order_by(Paquete.codigo).limit(limit)
    ).all()
    return [
        {
            "codigo": p.codigo,
            "empresa": p.empresa,
            "destinatario": p.destinatario,
            "estado": p.estado,
            "ubicacion": p.ubicacion
        }
        for p in paquetes
    ]

@app.get("/dashboard")
def dashboard(session: Session = Depends(get_session)):
    """Devuelve conteos agregados de paquetes por estado (compatible SQLAlchemy 2)."""
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

# Servir archivos estáticos (frontend)
static_dir = os.environ.get("STATIC_DIR", "web")
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
