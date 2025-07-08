#!/usr/bin/env python3
"""
Sistema de Seguimiento de Paquetería
Archivo principal para ejecutar la aplicación FastAPI
"""

import uvicorn
from src.interfaces.api import app

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 