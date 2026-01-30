import math
from typing import List, Optional, Tuple, Dict
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlmodel import Session, select
import networkx as nx

from backend.core.db import engine
from backend.models.entities import Map, Node, Edge, Alias

from backend.services.nlp import normalize_name, extract_a_b
from rapidfuzz import process, fuzz
import math

router = APIRouter()

# --- DEPENDENCY ---
def get_session():
    with Session(engine) as session:
        yield session

# --- MODELS ---
class Instruction(BaseModel):
    step: int
    text: str           # Câu hướng dẫn: "Rẽ trái tại Phòng Họp"
    action: str         # "straight", "left", "right", "elevator", "stairs", "arrive"
    distance_m: float   # Khoảng cách của bước này (mét)
    coordinate: List[float] # Tọa độ điểm xảy ra hành động [x, y]

class RouteResponse(BaseModel):
    map_id: int
    path_coords: List[List[float]] # Polyline tổng để vẽ lên bản đồ
    total_distance_m: float
    instructions: List[Instruction]

# --- MATH & GEO HELPERS ---

def calculate_angle(p1: Tuple[float, float], p2: Tuple[float, float], p3: Tuple[float, float]) -> float:
    """
    Tính góc tạo bởi 3 điểm p1 -> p2 -> p3.
    Trả về độ (degrees). Dương là rẽ phải, Âm là rẽ trái (trong hệ tọa độ màn hình y hướng xuống).
    """
    # Vector v1 (p1 -> p2)
    v1x, v1y = p2[0] - p1[0], p2[1] - p1[1]
    # Vector v2 (p2 -> p3)
    v2x, v2y = p3[0] - p2[0], p3[1] - p2[1]
    
    # Góc định hướng dùng atan2
    angle1 = math.atan2(v1y, v1x)
    angle2 = math.atan2(v2y, v2x)
    
    angle_diff = math.degrees(angle2 - angle1)
    
    # Chuẩn hóa về [-180, 180]
    while angle_diff <= -180: angle_diff += 360
    while angle_diff > 180: angle_diff -= 360
    
    return angle_diff

def get_turn_action(angle: float) -> str:
    """Xác định hành động dựa trên góc rẽ"""
    if angle > 45: return "right"      # Rẽ phải
    if angle < -45: return "left"      # Rẽ trái
    if angle > 15: return "slight_right" # Chếch phải
    if angle < -15: return "slight_left" # Chếch trái
    return "straight"

def get_distance(p1, p2):
    return math.hypot(p2[0] - p1[0], p2[1] - p1[1])

# --- DATABASE HELPERS ---

def get_node_name(session: Session, node_id: int) -> Optional[str]:
    """Tìm tên Alias hay nhất của node (ưu tiên weight cao)"""
    alias = session.exec(
        select(Alias).where(Alias.node_id == node_id).order_by(Alias.weight.desc())
    ).first()
    return alias.name if alias else None

def build_graph(session: Session, map_id: int) -> Tuple[nx.Graph, Dict]:
    """Tạo đồ thị NetworkX từ DB"""
    G = nx.Graph() # Dùng Graph vô hướng (bidirectional), hoặc DiGraph nếu cần 1 chiều
    node_pos = {}
    
    # 1. Load Nodes
    nodes = session.exec(select(Node).where(Node.map_id == map_id)).all()
    if not nodes:
        raise HTTPException(status_code=404, detail="Map chưa có node nào.")
    
    for n in nodes:
        G.add_node(n.id)
        node_pos[n.id] = (n.x, n.y)
        # Lưu tên landmark luôn để truy xuất nhanh
        G.nodes[n.id]['name'] = get_node_name(session, n.id)
        G.nodes[n.id]['is_landmark'] = n.is_landmark

    # 2. Load Edges
    # Tìm edge có start_node nằm trong map này
    edges = session.exec(
        select(Edge).join(Node, Edge.start_node_id == Node.id).where(Node.map_id == map_id)
    ).all()
    
    for e in edges:
        # data đi kèm cạnh
        attr = {
            "weight": e.weight, 
            "type": e.type, 
            "polyline": e.polyline if e.polyline else []
        }
        G.add_edge(e.start_node_id, e.end_node_id, **attr)
        # Nếu là 2 chiều thì logic Graph của NX tự hiểu kết nối 2 bên.
    
    return G, node_pos

# --- CORE LOGIC: GENERATE INSTRUCTIONS ---

def generate_human_instructions(
    G: nx.Graph, 
    path_nodes: List[int], 
    node_pos: Dict, 
    scale: float
) -> Tuple[List[Instruction], float]:
    
    instructions = []
    total_dist_px = 0.0
    
    if len(path_nodes) < 2:
        return [], 0.0

    # Bước 1: Khởi tạo
    start_node = path_nodes[0]
    start_name = G.nodes[start_node]['name'] or "Điểm xuất phát"
    instructions.append(Instruction(
        step=1,
        text=f"Bắt đầu tại {start_name}",
        action="start",
        distance_m=0,
        coordinate=[node_pos[start_node][0], node_pos[start_node][1]]
    ))

    # Biến tạm để cộng dồn khoảng cách cho hành động "Đi thẳng"
    accumulated_dist = 0.0
    last_turn_index = 0 
    
    # Duyệt qua từng cạnh trong đường đi
    for i in range(len(path_nodes) - 1):
        u = path_nodes[i]
        v = path_nodes[i+1]
        
        # Lấy thông tin cạnh
        edge_data = G.get_edge_data(u, v)
        dist_px = edge_data['weight'] # Weight này nên là độ dài pixel
        # Nếu trong DB weight đã nhân scale, cần chia lại, hoặc thống nhất weight = pixel length
        
        edge_type = edge_data.get('type', 'walk')
        
        total_dist_px += dist_px
        accumulated_dist += dist_px
        
        # Logic 1: Xác định nếu có thay đổi về Loại đường (Type)
        # Ví dụ: Đang đi bộ -> Gặp cầu thang
        is_type_change = False
        if i < len(path_nodes) - 2:
            next_u, next_v = path_nodes[i+1], path_nodes[i+2]
            next_type = G.get_edge_data(next_u, next_v).get('type', 'walk')
            if edge_type != next_type:
                is_type_change = True
        
        # Logic 2: Xác định Góc rẽ (Turn)
        turn_action = "straight"
        if i < len(path_nodes) - 2:
            # Lấy 3 điểm: u -> v -> w
            w = path_nodes[i+2]
            p1 = node_pos[u]
            p2 = node_pos[v]
            p3 = node_pos[w]
            angle = calculate_angle(p1, p2, p3)
            turn_action = get_turn_action(angle)

        # Logic 3: Xác định Landmark (Đi ngang qua)
        # Nếu node v là landmark và chúng ta KHÔNG rẽ tại v, thì nhắc "đi ngang qua"
        pass_landmark_text = ""
        v_name = G.nodes[v]['name']
        if v_name and turn_action == "straight" and not is_type_change:
             # Chỉ nhắc nếu đoạn đường đủ dài để đáng chú ý (> 5m)
             if accumulated_dist * scale > 5:
                 pass_landmark_text = f", đi ngang qua {v_name}"

        # --- QUYẾT ĐỊNH TẠO HƯỚNG DẪN MỚI ---
        # Chúng ta sẽ "ngắt" dòng và tạo hướng dẫn mới nếu:
        # 1. Có rẽ (trái/phải)
        # 2. Đổi loại đường (thang máy/cầu thang)
        # 3. Là điểm cuối cùng
        
        should_emit = (turn_action != "straight") or is_type_change or (i == len(path_nodes) - 2)
        
        if should_emit:
            dist_m = round(accumulated_dist * scale, 1)
            
            # Tạo câu text cho đoạn vừa đi qua
            current_text = ""
            
            # Xử lý text dựa trên loại đường VỪA ĐI
            if edge_type == "walk":
                current_text = f"Đi thẳng {dist_m}m{pass_landmark_text}"
            elif edge_type == "elevator":
                current_text = f"Đi thang máy ({dist_m}m)"
            elif edge_type == "stairs":
                current_text = f"Đi cầu thang bộ ({dist_m}m)"
            elif edge_type == "escalator":
                current_text = f"Đi thang cuốn ({dist_m}m)"
            
            # Nếu có rẽ ở cuối đoạn này, nối thêm câu rẽ
            next_node_name = G.nodes[v]['name']
            location_ref = f" tại {next_node_name}" if next_node_name else ""
            
            step_action = "straight" # Action chính của bước này (cho icon UI)
            
            if turn_action == "left":
                current_text += f", sau đó rẽ trái{location_ref}"
                step_action = "turn_left"
            elif turn_action == "right":
                current_text += f", sau đó rẽ phải{location_ref}"
                step_action = "turn_right"
            elif turn_action == "slight_left":
                current_text += f", chếch sang trái{location_ref}"
                step_action = "slight_left"
            elif turn_action == "slight_right":
                current_text += f", chếch sang phải{location_ref}"
                step_action = "slight_right"
            
            # Nếu đổi loại đường (ví dụ đang đi bộ -> gặp thang máy)
            if is_type_change:
                next_u, next_v = path_nodes[i+1], path_nodes[i+2]
                next_type = G.get_edge_data(next_u, next_v).get('type', 'walk')
                
                if next_type == "elevator":
                    current_text += f", đi vào thang máy"
                    step_action = "enter_elevator"
                elif next_type == "stairs":
                    current_text += f", đi vào cầu thang bộ"
                    step_action = "enter_stairs"
            
            # Override nếu là edge đặc biệt
            if edge_type == "elevator": step_action = "use_elevator"
            if edge_type == "stairs": step_action = "use_stairs"

            # Thêm vào danh sách
            instructions.append(Instruction(
                step=len(instructions) + 1,
                text=current_text,
                action=step_action,
                distance_m=dist_m,
                coordinate=[node_pos[v][0], node_pos[v][1]]
            ))
            
            # Reset cộng dồn
            accumulated_dist = 0.0

    # Bước cuối: Đích đến
    end_node = path_nodes[-1]
    end_name = G.nodes[end_node]['name'] or "Điểm đích"
    instructions.append(Instruction(
        step=len(instructions) + 1,
        text=f"Bạn đã đến {end_name}",
        action="arrive",
        distance_m=0,
        coordinate=[node_pos[end_node][0], node_pos[end_node][1]]
    ))

    return instructions, total_dist_px

def find_best_alias_node(
    session: Session,
    map_id: int,
    query: str,
    cx: Optional[float] = None,
    cy: Optional[float] = None,
) -> Optional[int]:
    """
    Tìm node_id dựa trên text search.
    Sử dụng RapidFuzz để so khớp gần đúng.
    """
    norm_q = normalize_name(query)
    
    # Lấy tất cả Alias của map này
    aliases = session.exec(
        select(Alias, Node).join(Node, Alias.node_id == Node.id).where(Node.map_id == map_id)
    ).all()
    
    if not aliases:
        return None

    # Tạo dict để fuzzy search: {id: norm_name}
    choices = {a.id: normalize_name(a.name) for (a, _n) in aliases}
    
    # Tìm top 5 kết quả giống nhất
    # process.extract trả về list [(name, score, key), ...]
    best_matches = process.extract(norm_q, choices, scorer=fuzz.token_set_ratio, limit=5)
    
    candidates = []
    # aliases_by_id = {a.id: (a, n) for a, n in aliases} # Map nhanh
    
    # Lọc những kết quả có độ khớp > 50 (để tránh lấy bừa)
    valid_keys = [res[2] for res in best_matches if res[1] > 50]
    
    if not valid_keys:
        return None

    # Lấy thông tin Node của các candidate
    for a, n in aliases:
        if a.id in valid_keys:
            candidates.append(n)

    if not candidates:
        return None

    # Nếu có tọa độ người dùng (cx, cy), ưu tiên Node gần nhất trong số các kết quả trùng tên
    # Ví dụ: Có 2 cái "Nhà vệ sinh", chọn cái gần người dùng nhất.
    if cx is not None and cy is not None:
        candidates.sort(key=lambda n: math.hypot(n.x - cx, n.y - cy))
        return candidates[0].id

    # Nếu không có tọa độ, trả về kết quả khớp nhất (thường là cái đầu tiên fuzzy trả về)
    # Ở đây ta lấy cái đầu tiên trong list candidates (đã được lọc)
    return candidates[0].id

# --- API ENDPOINT ---

@router.get("/find", response_model=RouteResponse)
def find_route(
    map_id: int, 
    start_node_id: int, 
    end_node_id: int, 
    session: Session = Depends(get_session)
):
    # 1. Lấy thông tin Map để có scale
    m = session.get(Map, map_id)
    if not m:
        raise HTTPException(status_code=404, detail="Map không tồn tại")
    scale = m.scale if m.scale else 1.0 # mét / pixel

    # 2. Build Graph & Tìm đường ngắn nhất (Dijkstra)
    G, node_pos = build_graph(session, map_id)
    
    if start_node_id not in G or end_node_id not in G:
        raise HTTPException(status_code=400, detail="Start/End node không thuộc map này")
        
    try:
        path_nodes = nx.shortest_path(G, source=start_node_id, target=end_node_id, weight="weight")
    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="Không tìm thấy đường đi")

    # 3. Tạo hướng dẫn chi tiết
    instrs, total_px = generate_human_instructions(G, path_nodes, node_pos, scale)
    
    # 4. Tạo Polyline tổng (để vẽ line liền mạch trên UI)
    full_polyline = []
    for node_id in path_nodes:
        full_polyline.append([node_pos[node_id][0], node_pos[node_id][1]])

    return RouteResponse(
        map_id=map_id,
        path_coords=full_polyline,
        total_distance_m=round(total_px * scale, 2),
        instructions=instrs
    )
    
    
@router.get("/query", response_model=RouteResponse)
def route_by_query(
    map_id: int,
    q: str = Query(..., description="Ví dụ: 'từ Sảnh A đến Thang máy'"),
    cx: Optional[float] = None,
    cy: Optional[float] = None,
    session: Session = Depends(get_session)
):
    # 1. Parse câu query
    start_txt, end_txt = extract_a_b(q)
    
    start_id = None
    end_id = None

    # 2. Tìm Start Node ID
    if start_txt:
        # Nếu người dùng nói "Từ A..."
        start_id = find_best_alias_node(session, map_id, start_txt, cx, cy)
    elif cx is not None and cy is not None:
        # Nếu người dùng không nói "Từ đâu", lấy vị trí hiện tại (cx, cy)
        # Tìm node gần nhất với cx, cy
        all_nodes = session.exec(select(Node).where(Node.map_id == map_id)).all()
        if all_nodes:
            # Sort theo khoảng cách
            all_nodes.sort(key=lambda n: math.hypot(n.x - cx, n.y - cy))
            start_id = all_nodes[0].id

    # 3. Tìm End Node ID
    if end_txt:
        end_id = find_best_alias_node(session, map_id, end_txt, cx, cy)
    
    # Error handling chi tiết
    errors = []
    if not start_id:
        source_desc = start_txt if start_txt else "vị trí của bạn"
        errors.append(f"Không tìm thấy điểm đi '{source_desc}'")
    if not end_id:
        dest_desc = end_txt if end_txt else "điểm đến"
        errors.append(f"Không tìm thấy điểm đến '{dest_desc}'")
        
    if errors:
        raise HTTPException(status_code=404, detail=". ".join(errors))

    # 4. Tính toán đường đi (Sử dụng lại logic của hàm find_route cũ nhưng gọi nội bộ)
    # Copy logic từ find_route hoặc tách logic find_route ra hàm riêng để tái sử dụng
    # Ở đây mình viết lại đoạn gọi logic cho gọn:
    
    m = session.get(Map, map_id)
    scale = m.scale if m and m.scale else 1.0

    G, node_pos = build_graph(session, map_id)
    
    try:
        path_nodes = nx.shortest_path(G, source=start_id, target=end_id, weight="weight")
    except nx.NetworkXNoPath:
        raise HTTPException(status_code=404, detail="Không có đường đi giữa hai điểm này.")
    except nx.NodeNotFound:
         raise HTTPException(status_code=400, detail="Lỗi dữ liệu đồ thị.")

    # Tạo hướng dẫn
    instrs, total_px = generate_human_instructions(G, path_nodes, node_pos, scale)
    
    # Tạo polyline
    full_polyline = [[node_pos[uid][0], node_pos[uid][1]] for uid in path_nodes]

    return RouteResponse(
        map_id=map_id,
        path_coords=full_polyline,
        total_distance_m=round(total_px * scale, 2),
        instructions=instrs
    )