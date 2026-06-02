FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV WOOGI_HOST=0.0.0.0
ENV PORT=8080

WORKDIR /app

RUN useradd --create-home --uid 10001 --shell /usr/sbin/nologin appuser

COPY --chown=appuser:appuser assets ./assets
COPY --chown=appuser:appuser src ./src
COPY --chown=appuser:appuser config.example.js firebase.json index.html manifest.json README.md server.py ./

USER appuser

EXPOSE 8080

CMD ["python3", "server.py"]
