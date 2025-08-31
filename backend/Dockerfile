# Dockerfile (backend)
FROM python:3.9.11

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Copy the .env manually if needed
ENV FLASK_ENV=production

CMD ["python", "app.py"]
