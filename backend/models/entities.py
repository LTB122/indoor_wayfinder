from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship, Column, JSON

class Map(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    image_link: str
    floor_number: int
    scale: float

    nodes: List["Node"] = Relationship(back_populates="map")


class Node(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    map_id: int = Field(foreign_key="map.id", index=True)
    x: float
    y: float
    is_landmark: bool = Field(default=False)

    map: Map = Relationship(back_populates="nodes")
    aliases: List["Alias"] = Relationship(back_populates="node")
    
    # Định nghĩa quan hệ ngược cho Edge
    edges_from: List["Edge"] = Relationship(
        back_populates="start_node", 
        sa_relationship_kwargs={"foreign_keys": "[Edge.start_node_id]"}
    )
    edges_to: List["Edge"] = Relationship(
        back_populates="end_node", 
        sa_relationship_kwargs={"foreign_keys": "[Edge.end_node_id]"}
    )


class Alias(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    node_id: int = Field(foreign_key="node.id", index=True)
    name: str
    
    node: Node = Relationship(back_populates="aliases")


class Edge(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    start_node_id: int = Field(foreign_key="node.id")
    end_node_id: int = Field(foreign_key="node.id")
    type: str
    # Sử dụng JSON thực thụ thay vì string
    polyline: Optional[list] = Field(default=None, sa_column=Column(JSON))
    weight: float
    bidirectional: bool = Field(default=True)
    
    # Phải tách biệt rõ start và end node
    start_node: Node = Relationship(
        back_populates="edges_from", 
        sa_relationship_kwargs={"foreign_keys": "[Edge.start_node_id]"}
    )
    end_node: Node = Relationship(
        back_populates="edges_to", 
        sa_relationship_kwargs={"foreign_keys": "[Edge.end_node_id]"}
    )