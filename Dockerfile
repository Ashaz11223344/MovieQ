FROM python:3.11-slim

WORKDIR /app
COPY . /app

RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

ENV PORT=8000
EXPOSE 8000

CMD ["gunicorn", "-w", "2", "-k", "gthread", "-b", "0.0.0.0:8000", "app:app"]
