from fastapi import FastAPI

from app.db.session import Base, engine
from app.api.v1.auth import router as auth_router

app = FastAPI(title="Notes Sync API")

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

app.include_router(auth_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
