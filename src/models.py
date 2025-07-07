from typing import List, Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class Evento(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
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
    eventos: List[Evento] = Relationship(back_populates="paquete")

Evento.paquete = Relationship(back_populates="eventos", sa_relationship_kwargs={"lazy": "selectin"})