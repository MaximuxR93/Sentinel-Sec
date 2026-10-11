from fastapi import FastAPI

from app.api.repositories import router as repositories_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
)


app.include_router(
    repositories_router
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": settings.app_name,
    }