import heapq
from collections import deque
import math

class Node:
    def __init__(self, x, y, parent=None, cost=0, priority=0):
        self.x = x
        self.y = y
        self.parent = parent
        self.cost = cost # g(n) for A* or Dijkstra
        self.priority = priority # f(n) = g(n) + h(n) for A*

    def __eq__(self, other):
        return isinstance(other, Node) and self.x == other.x and self.y == other.y

    def __hash__(self):
        return hash((self.x, self.y))
    
    def __lt__(self, other):
        return self.priority < other.priority

def get_neighbors(node, grid, weights=None):
    neighbors = []
    # Up, Down, Left, Right
    actions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
    
    for dx, dy in actions:
        nx, ny = node.x + dx, node.y + dy
        if 0 <= nx < len(grid) and 0 <= ny < len(grid[0]) and grid[nx][ny] == 0:
            # If no weights provided, every edge is 1. 
            # Otherwise use pollution weight from grid cell
            step_cost = 1
            if weights:
                step_cost = weights[nx][ny] + 1
                
            neighbors.append(Node(nx, ny, node, cost=node.cost + step_cost))
            
    return neighbors

def reconstruct_path(node):
    path = []
    current = node
    while current:
        path.append((current.x, current.y))
        current = current.parent
    return path[::-1]

def bfs(grid, start_pos, end_pos):
    """Breadth-First Search (Shortest by steps)"""
    start_node = Node(start_pos[0], start_pos[1])
    end_node = Node(end_pos[0], end_pos[1])
    queue = deque([start_node])
    visited = {start_node}
    
    while queue:
        current_node = queue.popleft()
        if current_node == end_node:
            return reconstruct_path(current_node)
        for neighbor in get_neighbors(current_node, grid):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return None

def dfs(grid, start_pos, end_pos):
    """Depth-First Search (Exploratory)"""
    start_node = Node(start_pos[0], start_pos[1])
    end_node = Node(end_pos[0], end_pos[1])
    stack = [start_node]
    visited = {start_node}
    
    while stack:
        current_node = stack.pop()
        if current_node == end_node:
            return reconstruct_path(current_node)
        for neighbor in get_neighbors(current_node, grid):
            if neighbor not in visited:
                visited.add(neighbor)
                stack.append(neighbor)
    return None

def dijkstra(grid, weights, start_pos, end_pos):
    """Dijkstra's Algorithm (Lowest Pollution Exposure)"""
    start_node = Node(start_pos[0], start_pos[1], cost=0, priority=0)
    end_node = (end_pos[0], end_pos[1])
    
    pq = [start_node]
    visited = {} # pos -> min_cost
    
    while pq:
        current_node = heapq.heappop(pq)
        pos = (current_node.x, current_node.y)
        
        if pos == end_node:
            return reconstruct_path(current_node)
            
        if pos in visited and visited[pos] <= current_node.cost:
            continue
            
        visited[pos] = current_node.cost
        
        for neighbor in get_neighbors(current_node, grid, weights):
            neighbor.priority = neighbor.cost
            heapq.heappush(pq, neighbor)
            
    return None

def a_star(grid, weights, start_pos, end_pos):
    """A* Search (Balanced Health and Distance)"""
    def heuristic(a, b):
        return math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2)

    start_node = Node(start_pos[0], start_pos[1], cost=0, priority=0)
    end_node = (end_pos[0], end_pos[1])
    
    pq = [start_node]
    visited = {}
    
    while pq:
        current_node = heapq.heappop(pq)
        pos = (current_node.x, current_node.y)
        
        if pos == end_node:
            return reconstruct_path(current_node)
            
        if pos in visited and visited[pos] <= current_node.cost:
            continue
            
        visited[pos] = current_node.cost
        
        for neighbor in get_neighbors(current_node, grid, weights):
            h = heuristic((neighbor.x, neighbor.y), end_node)
            neighbor.priority = neighbor.cost + h
            heapq.heappush(pq, neighbor)
            
    return None

if __name__ == "__main__":
    # Test all algorithms
    grid = [[0]*5 for _ in range(5)]
    weights = [[10]*5 for _ in range(5)] # Heavy pollution zones
    weights[0][1] = 1 # Clear corridor
    weights[1][1] = 1
    weights[2][1] = 1
    weights[2][2] = 1
    weights[2][3] = 1
    weights[3][3] = 1
    weights[4][3] = 1
    
    start = (0,0)
    end = (4,4)
    
    print("BFS:", len(bfs(grid, start, end)))
    print("Dijkstra (Pollution-Aware):", len(dijkstra(grid, weights, start, end)))
    print("A* (Health-Optimized):", len(a_star(grid, weights, start, end)))
