#!/usr/bin/env python3
"""
Script de inicio rápido para el Sistema de Seguimiento de Paquetería
Verifica dependencias y ejecuta la aplicación
"""

import sys
import subprocess
import importlib.util
from pathlib import Path

def check_dependency(module_name, package_name=None):
    """Verifica si una dependencia está instalada"""
    if package_name is None:
        package_name = module_name
    
    spec = importlib.util.find_spec(module_name)
    if spec is None:
        print(f"❌ Error: {package_name} no está instalado")
        print(f"   Ejecuta: pip install {package_name}")
        return False
    else:
        print(f"✅ {package_name} está instalado")
        return True

def main():
    print("🚚 Sistema de Seguimiento de Paquetería")
    print("=" * 50)
    
    # Verificar dependencias principales
    dependencies = [
        ("fastapi", "fastapi"),
        ("uvicorn", "uvicorn[standard]"),
        ("sqlmodel", "sqlmodel"),
        ("sqlalchemy", "sqlalchemy"),
        ("pydantic", "pydantic"),
    ]
    
    all_installed = True
    for module, package in dependencies:
        if not check_dependency(module, package):
            all_installed = False
    
    if not all_installed:
        print("\n❌ Faltan dependencias. Instálalas con:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    
    print("\n✅ Todas las dependencias están instaladas")
    
    # Verificar archivos necesarios
    required_files = [
        "main.py",
        "src/interfaces/api.py",
        "web/index.html",
        "web/style.css",
        "web/script.js"
    ]
    
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"✅ {file_path} existe")
        else:
            print(f"❌ Error: {file_path} no existe")
            sys.exit(1)
    
    print("\n🚀 Iniciando la aplicación...")
    print("   Frontend: http://localhost:8000")
    print("   API Docs: http://localhost:8000/docs")
    print("   Presiona Ctrl+C para detener")
    print("-" * 50)
    
    try:
        # Ejecutar la aplicación
        subprocess.run([sys.executable, "main.py"], check=True)
    except KeyboardInterrupt:
        print("\n👋 Aplicación detenida")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error al ejecutar la aplicación: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 