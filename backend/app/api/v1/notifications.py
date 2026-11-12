from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notification Center"])

@router.get("")
async def list_notifications(current_user: User = Depends(get_current_user)):
    return [
        {
            "id": "notif-01",
            "type": "delivery",
            "title": "Capsule Delivered & Ready",
            "subtitle": "Letter from Sophomore Year",
            "message": "Reflections on Data Structures & Algo finals sealed in December 2024.",
            "timestamp": "Today, 9:00 AM",
            "is_read": False,
            "meta": {
                "cipher": "AES-256 GCM • Verified Seal",
                "action_label": "Break Wax Seal & Read",
            }
        },
        {
            "id": "notif-02",
            "type": "reminder",
            "title": "Persistent Heartbeat Pulse",
            "subtitle": "Attempt 2 of 5",
            "message": "Unread graduation letter from Maya Lin. Reminders scheduled until verified recipient acknowledgement.",
            "timestamp": "Yesterday, 3:30 PM",
            "is_read": False,
            "meta": {
                "attempt": 2,
                "max_attempts": 5
            }
        },
        {
            "id": "notif-03",
            "type": "acknowledgement",
            "title": "Recipient Acknowledged",
            "subtitle": "Stanford Dorm 4B Capsule",
            "message": "Ananya K. successfully broke her cryptographic seal and acknowledged receipt.",
            "timestamp": "3 days ago",
            "is_read": True
        }
    ]

@router.post("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: User = Depends(get_current_user)):
    return {"status": "success", "id": notification_id, "is_read": True}

