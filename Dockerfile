FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    build-essential gcc g++ make cmake pkg-config \
    tesseract-ocr libtesseract-dev libleptonica-dev poppler-utils \
    libjpeg-dev zlib1g-dev libpng-dev libtiff-dev libfreetype6-dev \
    libopenblas-dev libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY constraints.txt requirements.txt ./
RUN pip install --upgrade pip setuptools wheel \
 && pip install --no-cache-dir -r requirements.txt -c constraints.txt
COPY . .
CMD ["python", "main.py"]
