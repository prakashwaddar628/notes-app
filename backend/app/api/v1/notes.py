from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.deps import get_db
from app.models.note import Note
from app.models.user import User
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate
from app.core.security import get_current_user

# redis
from app.core.redis import redis_client
import json

router = APIRouter(prefix="/notes", tags=["notes"])

@router.post("/", response_model=NoteRead)
def create_note(
    note_in: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = Note(
        user_id=current_user.id,
        title=note_in.title,
        content=note_in.content,
        version=1,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    # update cache
    cache_key = f"user:{current_user.id}:notes"
    redis_client.delete(cache_key)
    return note

@router.get("/", response_model=List[NoteRead])
def list_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cache_key = f"user:{current_user.id}:notes"

    # check cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # fetch from db
    notes = (
        db.query(Note)
        .filter(Note.user_id == current_user.id, Note.is_archived == False)
        .order_by(Note.updated_at.desc())
        .all()
    )

    # store in cache for 60 seconds
    redis_client.setex(cache_key, 60, json.dumps([note.__dict__ for note in notes], default=str))
    return notes

@router.get("/{note_id}", response_model=NoteRead)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note

@router.put("/{note_id}", response_model=NoteRead)
def update_note(
    note_id: int,
    note_in: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a note with optimistic concurrency control.
    The client must provide the current version of the note.
    add cache invalidation
    """
    note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    
    # check version for optimistic concurrency control
    if note.version != note_in.version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Note has been modified by another process",
        )
    
    # update fields
    if note_in.title is not None:
        note.title = note_in.title
    if note_in.content is not None:
        note.content = note_in.content
    
    note.version += 1
    db.add(note)
    db.commit()
    db.refresh(note)
    # invalidate cache
    cache_key = f"user:{current_user.id}:notes"
    redis_client.delete(cache_key)
    return note

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a note.
    Invalidate cache upon deletion.
    """
    note = (
        db.query(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    
    db.delete(note)
    db.commit()
    # invalidate cache
    cache_key = f"user:{current_user.id}:notes"
    redis_client.delete(cache_key)
    return