from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import Session, select
from backend.core.db import engine
from backend.models.entities import Node, Map, Alias, Edge

router = APIRouter()


def get_session():
    with Session(engine) as session:
        yield session

class NodeIn(BaseModel):
    map_id: int
    x: float
    y: float
    is_landmark: bool = False
    aliases: List[str] = [] 
    
class AliasOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class NodeOut(BaseModel):
    id: int
    map_id: int
    x: float
    y: float
    is_landmark: bool
    aliases: List[AliasOut] = [] 

    class Config:
        from_attributes = True
        
class NodeUpdate(BaseModel):
    x: Optional[float] = None
    y: Optional[float] = None
    is_landmark: Optional[bool] = None

@router.post("", response_model=NodeOut)
def create_node(payload: NodeIn, session: Session = Depends(get_session)):
    m = session.get(Map, payload.map_id)
    if not m:
        raise HTTPException(status_code=404, detail="Map không tồn tại.")
    
    node_data = payload.dict(exclude={"aliases"})
    n = Node(**node_data)
    session.add(n)
    session.flush() 
    
    for name in payload.aliases:
        alias = Alias(node_id=n.id, name=name)
        session.add(alias)
    
    session.commit()
    session.refresh(n)
    return n

@router.get("", response_model=List[NodeOut])
def list_nodes(map_id: int, session: Session = Depends(get_session)):
    stmt = select(Node).where(Node.map_id == map_id)
    return session.exec(stmt).all()

@router.get("/{node_id}", response_model=NodeOut)
def get_node(node_id: int, session: Session = Depends(get_session)):
    n = session.get(Node, node_id)
    if not n:
        raise HTTPException(status_code=404, detail="Node không tồn tại.")
    return n

@router.patch("/{node_id}", response_model=NodeOut)
def update_node(
    node_id: int, payload: NodeUpdate, session: Session = Depends(get_session)
):
    n = session.get(Node, node_id)
    if not n:
        raise HTTPException(status_code=404, detail="Node không tồn tại.")
    
    # Update các field cơ bản
    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(n, k, v)
        
    session.add(n)
    session.commit()
    session.refresh(n)
    return n

@router.delete("/{node_id}")
def delete_node(node_id: int, session: Session = Depends(get_session)):
    n = session.get(Node, node_id)
    if not n:
        raise HTTPException(status_code=404, detail="Node không tồn tại.")

    # Xoá alias liên quan
    stmt_alias = select(Alias).where(Alias.node_id == node_id)
    for a in session.exec(stmt_alias).all():
        session.delete(a)

    # Xoá edge liên quan (cả chiều đi và chiều đến)
    stmt_edge = select(Edge).where((Edge.start_node_id == node_id) | (Edge.end_node_id == node_id))
    for e in session.exec(stmt_edge).all():
        session.delete(e)

    session.delete(n)
    session.commit()
    return {"message": "Xóa node thành công"}