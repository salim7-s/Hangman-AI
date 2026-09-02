import os
from PIL import Image
import numpy as np

def remove_outer_checkerboard(img_path):
    img = Image.open(img_path).convert('RGBA')
    arr = np.array(img)
    H, W, _ = arr.shape
    
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # Identify checkerboard pixels: neutral gray/white (r ≈ g ≈ b)
    is_neutral = (np.abs(r.astype(int) - g.astype(int)) < 15) & \
                 (np.abs(g.astype(int) - b.astype(int)) < 15) & \
                 (np.abs(r.astype(int) - b.astype(int)) < 15)
                 
    is_checker_shade = is_neutral & ((r > 165) | (r < 30)) # either light checker squares or outer black line boundary
    
    # Flood-fill from borders to only remove outside neutral checkerboard
    from collections import deque
    visited = np.zeros((H, W), dtype=bool)
    to_erase = np.zeros((H, W), dtype=bool)
    
    q = deque()
    # add border pixels
    for x in range(W):
        for y in [0, 1, 2, 3]:
            q.append((y, x))
            visited[y, x] = True
        for y in [H-1, H-2]:
            q.append((y, x))
            visited[y, x] = True
            
    for y in range(H):
        for x in [0, 1, 2, 3]:
            q.append((y, x))
            visited[y, x] = True
        for x in [W-1, W-2]:
            q.append((y, x))
            visited[y, x] = True

    while q:
        y, x = q.popleft()
        
        # Check if current pixel is background checkerboard
        # Yellow body (r >> b) or blue clothes (b >> r) or dark black lines (unless at edge)
        # Background is neutral gray or white
        is_bg = (np.abs(int(r[y, x]) - int(g[y, x])) < 20) and \
                (np.abs(int(g[y, x]) - int(b[y, x])) < 20) and \
                (int(r[y, x]) > 140)
                
        if is_bg:
            to_erase[y, x] = True
            for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))
                    
    arr[to_erase, 3] = 0
    
    # Save back
    out_img = Image.fromarray(arr)
    out_img.save(img_path)
    print(f'Cleaned transparency for {img_path}')

for name in ['minion', 'spongebob', 'doraemon', 'spiderman', 'batman', 'deadpool']:
    p = f'frontend/public/inspectors/{name}.png'
    if os.path.exists(p):
        remove_outer_checkerboard(p)
