from pathlib import Path
import os
from sqlmodel import create_engine, SQLModel
from dotenv import load_dotenv

# Xác định thư mục hiện tại (chứa file db.py)
CURRENT_DIR = Path(__file__).resolve().parent

# Load .env cùng thư mục
ENV_PATH = CURRENT_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# Cho phép override bằng biến môi trường hệ thống
# DB_URL = os.getenv("WAYFINDER_DB_URL") or os.getenv("DATABASE_URL")
DB_URL = "postgresql://postgres:lethanhbaotran@db.jbllygkoaglldcgkkqph.supabase.co:5432/postgres"

# Nếu không có URL thì dùng SQLite mặc định trong thư mục data/db
if not DB_URL:
    BASE_DIR = CURRENT_DIR.parents[2]  # gốc project
    DB_DIR = BASE_DIR / "data" / "db"
    DB_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH = (DB_DIR / "wayfinder.db").resolve()
    DB_URL = f"sqlite:///{DB_PATH.as_posix()}"

# Tạo engine
if DB_URL.startswith("sqlite"):
    engine = create_engine(DB_URL, echo=False, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DB_URL, echo=False)


def init_db():
    from backend.models.entities import Map, Node, Alias, Edge

    SQLModel.metadata.create_all(engine)
