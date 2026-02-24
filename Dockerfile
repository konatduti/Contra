# syntax=docker/dockerfile:1.7

FROM python:3.12.11-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    VENV_PATH=/opt/venv

WORKDIR /build

# Build-only dependencies (kept out of final image)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    gcc \
    g++ \
    make \
    pkg-config \
    libtesseract-dev \
    libleptonica-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libpng-dev \
    libtiff-dev \
    libfreetype-dev \
    libopenblas-dev \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt constraints.txt ./

RUN python -m venv "$VENV_PATH" \
 && "$VENV_PATH/bin/pip" install --upgrade pip setuptools wheel \
 && "$VENV_PATH/bin/pip" install -r requirements.txt -c constraints.txt


FROM python:3.12.11-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    VENV_PATH=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Runtime-only libraries
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
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

RUN groupadd --system app && useradd --system --gid app --create-home app

COPY --from=builder /opt/venv /opt/venv

# Copy only runtime application files (no frontend/dev assets/tests)
COPY *.py ./
COPY templates ./templates
COPY migrations ./migrations
COPY favicon robots.txt ./

RUN find /opt/venv -type d -name '__pycache__' -prune -exec rm -rf {} + \
 && find /app -type d -name '__pycache__' -prune -exec rm -rf {} + \
 && find /opt/venv -type f -name '*.pyc' -delete \
 && chown -R app:app /app /opt/venv

USER app

EXPOSE 5000
CMD ["python", "main.py"]
