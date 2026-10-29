
# Stage 1: Build the React frontend
FROM node:22-slim AS frontend-build

WORKDIR /app/frontend

COPY mega_project_2/frontend/package*.json ./
RUN npm install

COPY mega_project_2/frontend/ ./
RUN npm run build

# Stage 2: Prepare the Python backend
FROM python:3.11-slim

WORKDIR /app

COPY mega_project_2/backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY mega_project_2/backend/ ./backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
