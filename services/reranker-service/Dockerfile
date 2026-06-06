FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# torch==2.5.1+cpu is pinned in requirements.txt with --extra-index-url so pip
# resolves the full dependency graph together and cannot downgrade torch.
RUN pip install --no-cache-dir -r requirements.txt

# Model weights download on first start and are cached in the hf_models volume.
ENV HF_HOME=/root/.cache/huggingface

COPY . .

EXPOSE 5003
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5003"]
