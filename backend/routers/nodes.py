from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import Session, select, delete
from backend.core.db import engine
# Đảm bảo import đủ các model
from backend.models.entities import Node, Map, Alias, Edge 

router = APIRouter()

def get_session():
    with Session(engine) as session:
        yield session

# --- SCHEMAS (DTO) ---

# 1. Thêm các trường name, type cho khớp DB
class NodeIn(BaseModel):
    map_id: int
    name: str 
    x: float
    y: float
    type: str = "path" # Mặc định là path
    related_map_id: Optional[int] = None
    aliases: List[str] = [] 

class AliasOut(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class NodeOut(BaseModel):
    id: int
    map_id: int
    name: str
    x: float
    y: float
    type: str
    related_map_id: Optional[int]
    aliases: List[AliasOut] = [] 
    class Config:
        from_attributes = True

# 2. Update cho phép sửa cả name, type và danh sách aliases
class NodeUpdate(BaseModel):
    name: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    type: Optional[str] = None
    related_map_id: Optional[int] = None
    aliases: Optional[List[str]] = None # Cho phép gửi list alias mới để thay thế

# --- ENDPOINTS ---

@router.post("", response_model=NodeOut)
def create_node(payload: NodeIn, session: Session = Depends(get_session)):
    # Validate Map tồn tại
    m = session.get(Map, payload.map_id)
    if not m:
        raise HTTPException(status_code=404, detail="Map không tồn tại.")
    
    # Dùng model_dump thay vì dict()
    node_data = payload.model_dump(exclude={"aliases"})
    
    # Tạo Node
    n = Node(**node_data)
    session.add(n)
    session.flush() # Flush để lấy n.id trước khi commit
    
    # Tạo Aliases
    if payload.aliases:
        for name in payload.aliases:
            alias = Alias(node_id=n.id, name=name)
            session.add(alias)
    
    session.commit()
    session.refresh(n)
    return n

@router.get("", response_model=List[NodeOut])
def list_nodes(map_id: int, session: Session = Depends(get_session)):
    # Nên order by id hoặc name để list không bị nhảy lung tung khi refresh
    stmt = select(Node).where(Node.map_id == map_id).order_by(Node.id)
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
    
    # 1. Update thông tin cơ bản
    data = payload.model_dump(exclude_unset=True, exclude={"aliases"})
    for k, v in data.items():
        setattr(n, k, v)
        
    # 2. Xử lý update Aliases (Nếu có gửi field aliases lên)
    if payload.aliases is not None:
        # Cách đơn giản nhất: Xóa hết cũ, tạo lại mới
        # (Lưu ý: Cách này làm thay đổi ID của alias, nếu Alias ID quan trọng thì cần logic diff phức tạp hơn)
        
        # Xóa alias cũ
        session.exec(delete(Alias).where(Alias.node_id == node_id))
        
        # Thêm alias mới
        for name in payload.aliases:
            new_alias = Alias(node_id=node_id, name=name)
            session.add(new_alias)

    session.add(n)
    session.commit()
    session.refresh(n)
    return n

@router.delete("/{node_id}")
def delete_node(node_id: int, session: Session = Depends(get_session)):
    n = session.get(Node, node_id)
    if not n:
        raise HTTPException(status_code=404, detail="Node không tồn tại.")

    # Dùng lệnh delete trực tiếp sẽ nhanh hơn là select all rồi loop delete
    # Xoá Alias
    session.exec(delete(Alias).where(Alias.node_id == node_id))

    # Xoá Edge liên quan
    session.exec(delete(Edge).where((Edge.start_node_id == node_id) | (Edge.end_node_id == node_id)))

    # Xoá Node
    session.delete(n)
    session.commit()
    return {"message": "Xóa node thành công", "node_id": node_id}