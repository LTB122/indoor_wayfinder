from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select
from rapidfuzz import fuzz, process
from backend.core.db import engine
from backend.models.entities import Alias, Node

router = APIRouter()


def get_session():
    with Session(engine) as session:
        yield session


class AliasIn(BaseModel):
    node_id: int
    name: str

class AliasOut(BaseModel):
    id: int
    node_id: int
    name: str

    class Config:
        from_attributes = True

class AliasSearchOut(BaseModel):
    node_id: int
    alias_id: int
    name: str
    score: float


@router.post("", response_model=AliasOut)
def create_alias(payload: AliasIn, session: Session = Depends(get_session)):
    # Kiểm tra node có tồn tại không
    n = session.get(Node, payload.node_id)
    if not n:
        raise HTTPException(status_code=404, detail="Node không tồn tại.")
    
    # Tạo alias mới
    a = Alias(
        node_id=payload.node_id,
        name=payload.name
    )
    session.add(a)
    session.commit()
    session.refresh(a)
    return a

@router.get("", response_model=List[AliasOut])
def list_aliases(node_id: Optional[int] = None, session: Session = Depends(get_session)):
    stmt = select(Alias)
    if node_id:
        stmt = stmt.where(Alias.node_id == node_id)
    return session.exec(stmt).all()

@router.get("/search", response_model=List[AliasSearchOut])
def search_alias(
    q: str = Query(..., description="Tên cần tìm"),
    limit: int = 5,
    session: Session = Depends(get_session),
):
    if not q or not q.strip():
        return []
    
    norm_q = q.strip().lower()
    stmt = select(Alias).where(Alias.name.ilike(f"%{norm_q}%"))
    items = session.exec(stmt).all()
    
    if not items:
        return []

    choices = {a.id: a.name for a in items}
    
    # token_set_ratio rất tốt cho việc tìm "Phòng họp" khi user gõ "họp phòng"
    results = process.extract(
        norm_q, 
        choices, 
        scorer=fuzz.token_set_ratio, 
        limit=limit
    )

    # Format kết quả trả về
    out = []
    items_map = {a.id: a for a in items}
    
    for _, score, alias_id in results:
        if score < 40: # Ngưỡng tối thiểu để được coi là khớp
            continue
            
        a = items_map.get(alias_id)
        out.append(
            AliasSearchOut(
                node_id=a.node_id,
                alias_id=a.id,
                name=a.name,
                score=float(score)
            )
        )
    return out
