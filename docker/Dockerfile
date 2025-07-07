# Dockerfile
# Ver ejemplo en la guía

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install fastapi uvicorn[standard] pydantic

COPY . .

# Servir archivos estáticos desde /app/web
ENV STATIC_DIR=/app/web

EXPOSE 8000

CMD ["uvicorn", "src.interfaces.api:app", "--host", "0.0.0.0", "--port", "8000"]
