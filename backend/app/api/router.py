from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.capsules import router as capsules_router
from app.api.v1.inbox import router as inbox_router
from app.api.v1.storage import router as storage_router
from app.api.v1.batches import router as batches_router
from app.api.v1.notifications import router as notifications_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(capsules_router)
api_router.include_router(inbox_router)
api_router.include_router(storage_router)
api_router.include_router(batches_router)
api_router.include_router(notifications_router)

