from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlmodel import Session, select
import json

from backend.core.db import engine
from backend.models.entities import Edge, Map, Node
from backend.services.geo import polyline_length

router = APIRouter()

TYPE_FACTORS = {
    "walk": 1.0,
    "stairs": 2.0,       # Cầu thang đi chậm và mệt hơn
    "elevator": 1.2,     # Thang máy nhanh nhưng có thời gian chờ
    "escalator": 1.1,    # Thang cuốn
    "restricted": 999.0  # Gần như không thể đi qua
}

def get_session():
    with Session(engine) as session:
        yield session


class EdgeIn(BaseModel):
    start_node_id: int
    end_node_id: int
    type: str = "walk"
    polyline: Optional[List[List[float]]] = None
    bidirectional: bool = True

class EdgeOut(BaseModel):
    id: int
    start_node_id: int
    end_node_id: int
    type: str
    polyline: List[List[float]]
    weight: float
    bidirectional: bool

    class Config:
        from_attributes = True
        
class EdgeUpdate(BaseModel):
    polyline: Optional[List[List[float]]] = None
    bidirectional: Optional[bool] = None


@router.post("", response_model=EdgeOut)
def create_edge(payload: EdgeIn, session: Session = Depends(get_session)):
    if payload.start_node_id == payload.end_node_id:
        raise HTTPException(status_code=400, detail="Node bắt đầu và kết thúc không được giống nhau.")

    s_node = session.get(Node, payload.start_node_id)
    e_node = session.get(Node, payload.end_node_id)
    
    m = session.get(Map, s_node.map_id)
    scale = m.scale if m and m.scale else 1.0
    
    if not s_node or not e_node:
        raise HTTPException(status_code=404, detail="Một trong hai Node không tồn tại.")
    
    if s_node.map_id != e_node.map_id:
        raise HTTPException(status_code=400, detail="Hai node phải thuộc cùng một bản đồ.")

    poly = payload.polyline
    if not poly or len(poly) < 2:
        poly = [[s_node.x, s_node.y], [e_node.x, e_node.y]]

    poly[0] = [s_node.x, s_node.y]
    poly[-1] = [e_node.x, e_node.y]

    factor = TYPE_FACTORS.get(payload.type, 1.0)
    pixel_length = polyline_length(poly)
    actual_weight = (pixel_length * scale) * factor

    edge = Edge(
        start_node_id=s_node.id,
        end_node_id=e_node.id,
        type=payload.type,
        polyline=poly, 
        weight=actual_weight,
        bidirectional=payload.bidirectional
    )
    
    session.add(edge)
    session.commit()
    session.refresh(edge)
    return edge

@router.get("", response_model=List[EdgeOut])
def list_edges(map_id: int, session: Session = Depends(get_session)):
    stmt = select(Edge).join(Node, Edge.start_node_id == Node.id).where(Node.map_id == map_id)
    return session.exec(stmt).all()

@router.patch("/{edge_id}", response_model=EdgeOut)
def update_edge(edge_id: int, payload: EdgeUpdate, session: Session = Depends(get_session)):
    ed = session.get(Edge, edge_id)
    if not ed:
        raise HTTPException(status_code=404, detail="Cạnh không tồn tại.")

    data = payload.dict(exclude_unset=True)
    
    # Nếu đổi type hoặc đổi polyline thì phải tính lại weight
    if "type" in data or "polyline" in data:
        new_type = data.get("type", ed.type)
        new_poly = data.get("polyline", ed.polyline)
        
        # Lấy scale từ Map
        stmt = select(Map).join(Node).where(Node.id == ed.start_node_id)
        m = session.exec(stmt).first()
        scale = m.scale if m else 1.0
        
        factor = TYPE_FACTORS.get(new_type, 1.0)
        
        ed.polyline = new_poly
        ed.type = new_type
        ed.weight = (polyline_length(new_poly) * scale) * factor
        
        # Xóa khỏi data để không bị setattr đè lại lần nữa bên dưới
        data.pop("type", None)
        data.pop("polyline", None)

    for k, v in data.items():
        setattr(ed, k, v)

    session.add(ed)
    session.commit()
    session.refresh(ed)
    return ed

@router.delete("/{edge_id}", response_model=dict)
def delete_edge(edge_id: int, session: Session = Depends(get_session)):
    ed = session.get(Edge, edge_id)
    if not ed:
        raise HTTPException(status_code=404, detail="Edge không tồn tại.")
    session.delete(ed)
    session.commit()
    return {"ok": True}