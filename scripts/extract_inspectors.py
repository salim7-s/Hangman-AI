import os
from PIL import Image
import numpy as np

img = Image.open('frontend/public/sprites.png').convert('RGBA')
width, height = img.size

cols = 5
rows = 4

col_w = width / cols
row_h = height / rows

# Characters mapping (col, row):
# Row 0: Iron Man (0,0), Spider-Man (1,0), Doraemon (2,0), Shinchan (3,0), Batman (4,0)
# Row 1: Superman (0,1), Hulk (1,1), Cap (2,1), Pikachu (3,1), Naruto (4,1)
# Row 2: Goku (0,2), SpongeBob (1,2), Ben10 (2,2), Tom (3,2), Jerry (4,2)
# Row 3: Deadpool (0,3), Flash (1,3), WonderWoman (2,3), Panda (3,3), Minion (4,3)

selected_chars = {
    'doraemon': (2, 0, 'DORAEMON', 'BLUE ROBOT CAT', 'GADGET EXPERT', 'I have a gadget for every classified word!'),
    'spiderman': (1, 0, 'SPIDER-MAN', 'WEB DETECTIVE', 'STREET HERO', 'My spider-sense is tingling. That letter is wrong!'),
    'batman': (4, 0, 'BATMAN', 'DARK KNIGHT', 'MASTER DETECTIVE', 'I am vengeance. I am the night. Guess carefully.'),
    'spongebob': (1, 2, 'SPONGEBOB', 'POROUS SLEUTH', 'UNDERWATER DETECTIVE', "I'm ready! I'm ready! Let's crack this case!"),
    'deadpool': (0, 3, 'DEADPOOL', 'MERC WITH A MOUTH', 'CHAOS AGENT', 'Maximum effort! Do not mess up my strikes, buddy.'),
    'minion': (4, 3, 'MINION', 'YELLOW HELPER', 'SPECIAL AGENT', 'Bello! Banana! Six strikes, no problem!'),
}

os.makedirs('frontend/public/inspectors', exist_ok=True)

for key, (c, r, name, role, category, message) in selected_chars.items():
    left = int(c * col_w)
    top = int(r * row_h)
    right = int((c + 1) * col_w)
    bottom = int((r + 1) * row_h)

    crop = img.crop((left, top, right, bottom))

    # Convert fake gray/white checkerboard pixels into true transparent alpha
    arr = np.array(crop)
    r_ch, g_ch, b_ch, a_ch = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

    # Checkerboard gray is around (200-215, 200-215, 200-215) and white is (250-255, 250-255, 250-255)
    is_gray_checker = (np.abs(r_ch.astype(int) - g_ch.astype(int)) < 8) & \
                      (np.abs(g_ch.astype(int) - b_ch.astype(int)) < 8) & \
                      (((r_ch >= 190) & (r_ch <= 215)) | (r_ch >= 248))

    # We do a flood-fill or boundary check so we only erase outside background
    from scipy.ndimage import binary_dilation, label

    # Create mask of background starting from corners/edges
    bg_seed = np.zeros_like(is_gray_checker, dtype=bool)
    bg_seed[0, :] = is_gray_checker[0, :]
    bg_seed[-1, :] = is_gray_checker[-1, :]
    bg_seed[:, 0] = is_gray_checker[:, 0]
    bg_seed[:, -1] = is_gray_checker[:, -1]

    # Connected component of background
    labeled, num = label(is_gray_checker)
    edge_labels = set(labeled[0, :]).union(labeled[-1, :]).union(labeled[:, 0]).union(labeled[:, -1])
    edge_labels.discard(0)

    bg_mask = np.isin(labeled, list(edge_labels))

    arr[bg_mask, 3] = 0

    out_img = Image.fromarray(arr)
    out_path = f'frontend/public/inspectors/{key}.png'
    out_img.save(out_path)
    print(f'Saved {key} -> {out_path} ({out_img.size})')

# Also copy classic detective as default
if os.path.exists('detective_noir_1788353564383.jpg'):
    img_noir = Image.open('detective_noir_1788353564383.jpg').convert('RGBA')
    # Remove pure white background
    arr_n = np.array(img_noir)
    white_mask = (arr_n[:, :, 0] > 240) & (arr_n[:, :, 1] > 240) & (arr_n[:, :, 2] > 240)
    arr_n[white_mask, 3] = 0
    Image.fromarray(arr_n).save('frontend/public/inspectors/default_noir.png')
    print('Saved default_noir.png')
