# ---------- BUILD STAGE ----------
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    build-essential gcc g++ make cmake pkg-config \
    tesseract-ocr libtesseract-dev libleptonica-dev poppler-utils \
    libjpeg-dev zlib1g-dev libpng-dev libtiff-dev libfreetype6-dev \
    libopenblas-dev libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /install
COPY constraints.txt requirements.txt ./

RUN pip install --upgrade pip setuptools wheel \
 && pip install --prefix=/install --no-cache-dir -r requirements.txt -c constraints.txt

# ---------- RUNTIME STAGE ----------
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# install ONLY runtime libs (no compilers, no dev headers)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    libjpeg62-turbo \
    zlib1g \
    libpng16-16 \
    libtiff6 \
    libfreetype6 \
    libopenblas0 \
    libgomp1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /install /usr/local

COPY . .

CMD ["python", "main.py"]
