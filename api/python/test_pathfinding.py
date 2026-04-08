import pathfinding

def test_pathfinding():
    print("Running Pathfinding Tests...")
    
    # 10x10 grid
    grid = [[0 for _ in range(10)] for _ in range(10)]
    
    # Create a wall
    for i in range(1, 9):
        grid[5][i] = 1
        
    start = (0, 0)
    end = (9, 9)
    
    print(f"Start: {start}, End: {end}")
    
    bfs_path = pathfinding.bfs(grid, start, end)
    print(f"BFS Path Length: {len(bfs_path) if bfs_path else 'None'}")
    if bfs_path:
        print(f"BFS Path: {bfs_path[:5]}...{bfs_path[-5:]}")
        
    dfs_path = pathfinding.dfs(grid, start, end)
    print(f"DFS Path Length: {len(dfs_path) if dfs_path else 'None'}")
    if dfs_path:
        print(f"DFS Path: {dfs_path[:5]}...{dfs_path[-5:]}")
        
    # Check if BFS is shorter than DFS (usually it is for complex paths)
    if bfs_path and dfs_path:
        if len(bfs_path) <= len(dfs_path):
            print("SUCCESS: BFS found a path equal or shorter than DFS.")
        else:
            print("WARNING: BFS path is longer than DFS path. This shouldn't happen in unweighted grids.")

    # Test Unreachable
    blocked_grid = [[1, 1], [1, 1]]
    res = pathfinding.bfs(blocked_grid, (0,0), (1,1))
    print(f"Unreachable Test (BFS): {'Passed' if res is None else 'Failed'}")

if __name__ == "__main__":
    test_pathfinding()
