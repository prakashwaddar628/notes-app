from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NoteBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class NoteCreate(NoteBase):
    pass

class NoteUpdate(NoteBase):
    version: int

class NoteRead(NoteBase):
    id: int
    user_id: int
    version: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True