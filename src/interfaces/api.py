from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Seguimiento de Paquetería API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simulación de base de datos en memoria
paquetes = {}

class PaqueteRegistro(BaseModel):
    empresa: str
    destinatario: str
    direccion: str
    telefono: str
    ruta: str

class PaqueteEstado(BaseModel):
    codigo: str
    estado: str
    ubicacion: str

class SeguimientoRequest(BaseModel):
    codigo: str

class Evento(BaseModel):
    estado: str
    ubicacion: str
    fecha: str

class PaqueteInfo(BaseModel):
    codigo: str
    empresa: str
    destinatario: str
    direccion: str
    telefono: str
    ruta: str
    estado: str
    ubicacion: str
    eventos: List[Evento]

@app.post("/paquetes", response_model=PaqueteInfo)
def registrar_paquete(data: PaqueteRegistro):
    codigo = f"PKG-{uuid.uuid4().hex[:8].upper()}"
    evento = Evento(estado="en_bodega", ubicacion="Bodega", fecha=datetime.now().isoformat())
    paquete = PaqueteInfo(
        codigo=codigo,
        empresa=data.empresa,
        destinatario=data.destinatario,
        direccion=data.direccion,
        telefono=data.telefono,
        ruta=data.ruta,
        estado="en_bodega",
        ubicacion="Bodega",
        eventos=[evento]
    )
    paquetes[codigo] = paquete
    return paquete

@app.patch("/paquetes/estado", response_model=PaqueteInfo)
def actualizar_estado(data: PaqueteEstado):
    paquete = paquetes.get(data.codigo)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    evento = Evento(estado=data.estado, ubicacion=data.ubicacion, fecha=datetime.now().isoformat())
    paquete.estado = data.estado
    paquete.ubicacion = data.ubicacion
    paquete.eventos.append(evento)
    return paquete

@app.get("/paquetes/{codigo}", response_model=PaqueteInfo)
def consultar_paquete(codigo: str):
    paquete = paquetes.get(codigo)
    if not paquete:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
    return paquete

@app.get("/dashboard")
def dashboard():
    total = len(paquetes)
    en_bodega = len([p for p in paquetes.values() if p.estado == "en_bodega"])
    en_transito = len([p for p in paquetes.values() if p.estado == "en_transito"])
    entregado = len([p for p in paquetes.values() if p.estado == "entregado"])
    return {
        "total": total,
        "en_bodega": en_bodega,
        "en_transito": en_transito,
        "entregado": entregado
    }

@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# Servir archivos estáticos (frontend)
static_dir = os.environ.get("STATIC_DIR", "web")
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
