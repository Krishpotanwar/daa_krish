from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Tuple, Optional
try:
    import pathfinding
except ImportError:
    from api.python import pathfinding
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI(title="BreatheWay Pathfinding API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PathRequest(BaseModel):
    start: Tuple[int, int]
    end: Tuple[int, int]
    grid_size: Optional[int] = 20

class PathResponse(BaseModel):
    bfs_path: Optional[List[Tuple[int, int]]]
    dfs_path: Optional[List[Tuple[int, int]]]
    dijkstra_path: Optional[List[Tuple[int, int]]]
    a_star_path: Optional[List[Tuple[int, int]]]
    grid: List[List[int]]
    weights: List[List[int]]

def generate_mock_data(size: int, start: Tuple[int, int], end: Tuple[int, int]):
    # Create an empty grid (0 = passable)
    grid = [[0 for _ in range(size)] for _ in range(size)]
    
    # Create weights (pollution levels 0-100)
    # Higher weights make Dijkstra/A* avoid those areas
    weights = [[random.randint(5, 50) for _ in range(size)] for _ in range(size)]
    
    # Create a "dirty" corridor (High pollution)
    for i in range(size):
        weights[size // 2][i] = 100
        
    # Create a "clean" corridor (Low pollution)
    for i in range(size):
        weights[i][size // 4] = 0
        
    # Add some obstacles
    if size >= 10:
        for i in range(2, size-5):
            grid[i][size-3] = 1 # Obstacle
            
    # Ensure start and end are reachable
    grid[start[0]][start[1]] = 0
    grid[end[0]][end[1]] = 0
    weights[start[0]][start[1]] = 0
    weights[end[0]][end[1]] = 0
    
    return grid, weights

@app.get("/")
def read_root():
    return {"message": "Welcome to BreatheWay Pathfinding API", "algorithms": ["BFS", "DFS", "Dijkstra", "A*"]}

@app.post("/find-path", response_model=PathResponse)
def find_path(request: PathRequest):
    grid, weights = generate_mock_data(request.grid_size, request.start, request.end)
    
    bfs_res = pathfinding.bfs(grid, request.start, request.end)
    dfs_res = pathfinding.dfs(grid, request.start, request.end)
    dijkstra_res = pathfinding.dijkstra(grid, weights, request.start, request.end)
    a_star_res = pathfinding.a_star(grid, weights, request.start, request.end)
    
    return {
        "bfs_path": bfs_res,
        "dfs_path": dfs_res,
        "dijkstra_path": dijkstra_res,
        "a_star_path": a_star_res,
        "grid": grid,
        "weights": weights
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
