FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm

# PDF/RAG 보조 스크립트 실행용 파이썬 도구 설치
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*
