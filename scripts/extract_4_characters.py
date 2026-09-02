import os
from PIL import Image
import numpy as np
from collections import deque

img = Image.open('frontend/public/sprites.png').convert('RGBA')
width, height = img.size

cols = 5
rows = 4

col_w = width / cols
row_h = height / rows

# We want 4 clean characters:
# 1. Spiderman: (col 1, row 0)
# 2. Doraemon: (col 2, row 0)
# 3. SpongeBob: (col 1, row 2)
# 4. Minion: (col 4, row 3)

target_chars = {
    'spiderman': (1, 0, 'SPIDER-MAN', 'WEB SLEUTH', 'SUPERHERO', 'My spider-sense is tingling. Think twice before guessing!'),
    'doraemon': (2, 0, 'DORAEMON', 'TECH SPECIALIST', 'GADGET CAT', "I've got a 22nd-century gadget to solve any classified word!"),
    'spongebob': (1, 2, 'SPONGEBOB', 'UNDERWATER DETECTIVE', 'POROUS SLEUTH', "I'm ready! I'm ready! Let's deduce this secret word!"),
    'minion': (4, 3, 'MINION', 'FIELD ASSISTANT', 'HELPER', 'Bello! Banana! Six wrong strikes and we are toast!'),
}

os.makedirs('frontend/public/inspectors', exist_ok=True)

for key, (c, r, name, role, category, message) in target_chars.items():
    # Inset by 4px to avoid outer grid lines
    left = int(c * col_w) + 4
    top = int(r * row_h) + 4
    right = int((c + 1) * col_w) - 4
    bottom = int((r + 1) * row_h) - 4

    crop = img.crop((left, top, right, bottom))
    arr = np.array(crop)
    H, W, _ = arr.shape
    r_ch, g_ch, b_ch, a_ch = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    # Erase outer checkerboard using flood fill from edges
    visited = np.zeros((H, W), dtype=bool)
    to_erase = np.zeros((H, W), dtype=bool)
    q = deque()

    for x in range(W):
        for y in range(6):
            q.append((y, x))
            visited[y, x] = True
        for y in range(H-6, H):
            q.append((y, x))
            visited[y, x] = True

    for y in range(H):
        for x in range(6):
            q.append((y, x))
            visited[y, x] = True
        for x in range(W-6, W):
            q.append((y, x))
            visited[y, x] = True

    while q:
        y, x = q.popleft()
        
        # Check if background: neutral gray or white or edge lines
        is_neutral = (abs(int(r_ch[y, x]) - int(g_ch[y, x])) < 22) and \
                     (abs(int(g_ch[y, x]) - int(b_ch[y, x])) < 22) and \
                     (abs(int(r_ch[y, x]) - int(b_ch[y, x])) < 22)
                     
        is_bg_light = is_neutral and (int(r_ch[y, x]) > 130)
        is_edge_line = (y < 4 or y >= H-4 or x < 4 or x >= W-4) and (int(r_ch[y, x]) < 80)

        if is_bg_light or is_edge_line:
            to_erase[y, x] = True
            for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    arr[to_erase, 3] = 0

    # Crop out extra transparent borders around the character
    non_empty = np.where(arr[:, :, 3] > 0)
    if len(non_empty[0]) > 0:
        min_y, max_y = np.min(non_empty[0]), np.max(non_empty[0])
        min_x, max_x = np.min(non_empty[1]), np.max(non_empty[1])
        # Add slight padding
        pad = 8
        min_y = max(0, min_y - pad)
        max_y = min(H, max_y + pad)
        min_x = max(0, min_x - pad)
        max_x = min(W, max_x + pad)
        arr = arr[min_y:max_y, min_x:max_x]

    out_img = Image.fromarray(arr)
    out_path = f'frontend/public/inspectors/{key}.png'
    out_img.save(out_path)
    print(f'Processed {key} -> {out_path} ({out_img.size})')
