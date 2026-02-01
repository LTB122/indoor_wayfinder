import os
import shutil
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from PIL import Image
from sqlmodel import Session, select

from backend.core.db import engine
from backend.models.entities import Map

router = APIRouter()

UPLOAD_DIR = os.path.join("data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

BASE_STATIC = "/static/uploads"


def get_session():
    with Session(engine) as session:
        yield session


@router.post("", response_model=Map)
async def create_map(
    name: str = Form(...),
    floor_number: int = Form(...),
    scale: float = Form(1.0),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg", "image/webp"]:
        raise HTTPException(status_code=400, detail="File phải là ảnh (png/jpg/webp).")

    # 2. Tạo tên file duy nhất
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    ext = os.path.splitext(file.filename)[1].lower() or ".png"
    filename = f"map_{ts}{ext}"
    disk_path = os.path.join(UPLOAD_DIR, filename)

    with open(disk_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Lưu đường dẫn tương đối từ trong thư mục data
    relative_path = os.path.relpath(disk_path, "data")

    new_map = Map(
        name=name, floor_number=floor_number, scale=scale, image_link=relative_path
    )

    session.add(new_map)
    session.commit()
    session.refresh(new_map)

    return new_map


@router.get("/{map_id}", response_model=Map)
def get_map(map_id: int, session: Session = Depends(get_session)):
    m = session.get(Map, map_id)
    if not m:
        raise HTTPException(status_code=404, detail="Map không tồn tại.")
    return m


@router.get("", response_model=dict)
def list_maps(session: Session = Depends(get_session)):
    # Lấy danh sách map, có thể thêm order_by nếu có field created_at
    statement = select(Map)
    maps = session.exec(statement).all()

    return {"items": [m for m in maps]}


@router.delete("/{map_id}")
def delete_map(map_id: int, session: Session = Depends(get_session)):
    m = session.get(Map, map_id)
    if not m:
        raise HTTPException(status_code=404, detail="Map không tồn tại.")

    # Xóa file vật lý trước khi xóa DB
    if os.path.exists(m.image_link):
        os.remove(m.image_link)

    session.delete(m)
    session.commit()
    return {"message": "Đã xóa map thành công"}
