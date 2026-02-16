#!/usr/bin/env python3
"""
m00-os-7 Icon Generator

Generates Mac OS 7 style system icons using PIL.
Run this script to regenerate all icons.

Usage:
    python generate_icons.py [--all | --system | --apps | --ui]
"""

import sys
import os

# Add scripts directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from asset_utils import (
    COLORS, ICON_SIZE_STANDARD, ICON_SIZE_SMALL,
    create_icon, save_icon, add_shadow,
    draw_folder_base, draw_document_base, draw_trash_base
)
from PIL import ImageDraw


# ============================================
# System Icons
# ============================================

def generate_folder_icon():
    """Generate closed folder icon."""
    img, draw = create_icon()
    draw_folder_base(draw)
    img = add_shadow(img)
    save_icon(img, 'folder', 'icons/system')

def generate_folder_open_icon():
    """Generate open folder icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Back of folder
    draw.rectangle([2, 8, w - 3, h - 3], fill=COLORS['folder_dark'], outline=COLORS['black'])

    # Open lid (tilted)
    lid_points = [
        (2, 8),
        (4, 3),
        (w - 5, 3),
        (w - 3, 8)
    ]
    draw.polygon(lid_points, fill=COLORS['folder_yellow'], outline=COLORS['black'])

    # Front of folder
    front_points = [
        (0, 12),
        (4, 8),
        (w - 5, 8),
        (w - 1, 12),
        (w - 3, h - 3),
        (2, h - 3)
    ]
    draw.polygon(front_points, fill=COLORS['folder_yellow'], outline=COLORS['black'])

    # 3D highlights
    draw.line([(1, 13), (w - 4, h - 4)], fill=COLORS['folder_dark'])

    img = add_shadow(img)
    save_icon(img, 'folder-open', 'icons/system')

def generate_document_icon():
    """Generate generic document icon."""
    img, draw = create_icon()
    draw_document_base(draw)
    img = add_shadow(img)
    save_icon(img, 'document', 'icons/system')

def generate_trash_empty_icon():
    """Generate empty trash icon."""
    img, draw = create_icon()
    draw_trash_base(draw, is_full=False)
    img = add_shadow(img)
    save_icon(img, 'trash-empty', 'icons/system')

def generate_trash_full_icon():
    """Generate full trash icon."""
    img, draw = create_icon()
    draw_trash_base(draw, is_full=True)
    img = add_shadow(img)
    save_icon(img, 'trash-full', 'icons/system')

def generate_hard_drive_icon():
    """Generate hard drive icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Main drive body (3D box)
    # Top face
    top_points = [
        (2, 8),
        (w // 2, 2),
        (w - 3, 8),
        (w // 2, 14)
    ]
    draw.polygon(top_points, fill=COLORS['gray_light'], outline=COLORS['black'])

    # Front face
    front_points = [
        (2, 8),
        (w // 2, 14),
        (w // 2, h - 3),
        (2, h - 9)
    ]
    draw.polygon(front_points, fill=COLORS['gray_medium'], outline=COLORS['black'])

    # Right face
    right_points = [
        (w // 2, 14),
        (w - 3, 8),
        (w - 3, h - 9),
        (w // 2, h - 3)
    ]
    draw.polygon(right_points, fill=COLORS['gray_dark'], outline=COLORS['black'])

    # Drive label on top
    draw.rectangle([10, 6, 22, 10], fill=COLORS['white'], outline=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'hard-drive', 'icons/system')

def generate_finder_icon():
    """Generate Finder application icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Happy Mac face background
    draw.rectangle([4, 2, w - 5, h - 4], fill=COLORS['gray_light'], outline=COLORS['black'])

    # Screen area
    draw.rectangle([6, 4, w - 7, h - 10], fill=COLORS['white'], outline=COLORS['black'])

    # Happy face on screen
    # Eyes
    draw.rectangle([10, 8, 12, 12], fill=COLORS['black'])
    draw.rectangle([19, 8, 21, 12], fill=COLORS['black'])

    # Nose
    draw.polygon([(15, 13), (16, 16), (14, 16)], fill=COLORS['black'])

    # Smile
    draw.arc([10, 14, 21, 20], 0, 180, fill=COLORS['black'])

    # Base/stand
    draw.rectangle([12, h - 8, w - 13, h - 4], fill=COLORS['gray_medium'], outline=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'finder', 'icons/system')

def generate_application_icon():
    """Generate generic application icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Diamond/rhombus shape
    points = [
        (w // 2, 2),
        (w - 3, h // 2),
        (w // 2, h - 3),
        (3, h // 2)
    ]
    draw.polygon(points, fill=COLORS['gray_light'], outline=COLORS['black'])

    # Inner highlight
    inner_points = [
        (w // 2, 6),
        (w - 7, h // 2),
        (w // 2, h - 7),
        (7, h // 2)
    ]
    draw.polygon(inner_points, fill=COLORS['white'], outline=COLORS['gray_dark'])

    # "A" letter in center
    draw.text((12, 10), "A", fill=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'application', 'icons/system')


# ============================================
# Application Icons
# ============================================

def generate_calculator_icon():
    """Generate Calculator application icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Calculator body
    draw.rectangle([4, 2, w - 5, h - 3], fill=COLORS['gray_light'], outline=COLORS['black'])

    # Display
    draw.rectangle([6, 4, w - 7, 10], fill=COLORS['white'], outline=COLORS['black'])

    # Buttons (4x4 grid)
    btn_size = 4
    start_x = 6
    start_y = 12
    for row in range(4):
        for col in range(4):
            x = start_x + col * (btn_size + 1)
            y = start_y + row * (btn_size + 1)
            color = COLORS['white'] if col < 3 else COLORS['gray_medium']
            draw.rectangle([x, y, x + btn_size, y + btn_size], fill=color, outline=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'calculator', 'icons/apps')

def generate_simpletext_icon():
    """Generate SimpleText application icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Document with pencil
    draw_document_base(draw)

    # Pencil overlay (diagonal)
    pencil_points = [
        (w - 8, 4),
        (w - 4, 8),
        (w - 12, h - 4),
        (w - 16, h - 8)
    ]
    draw.polygon(pencil_points, fill=COLORS['yellow'], outline=COLORS['black'])

    # Pencil tip
    draw.polygon([(w - 12, h - 4), (w - 14, h - 2), (w - 16, h - 8)], fill=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'simpletext', 'icons/apps')

def generate_notepad_icon():
    """Generate NotePad application icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Notepad body (yellow)
    draw.rectangle([4, 4, w - 5, h - 3], fill=COLORS['yellow'], outline=COLORS['black'])

    # Spiral binding at top
    for i in range(5):
        x = 8 + i * 4
        draw.ellipse([x, 2, x + 3, 6], fill=COLORS['gray_medium'], outline=COLORS['black'])

    # Lines on notepad
    for y in range(10, h - 6, 4):
        draw.line([(6, y), (w - 7, y)], fill=COLORS['blue'])

    img = add_shadow(img)
    save_icon(img, 'notepad', 'icons/apps')

def generate_scrapbook_icon():
    """Generate Scrapbook application icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Book cover
    draw.rectangle([4, 2, w - 6, h - 4], fill=COLORS['magenta'], outline=COLORS['black'])

    # Book spine
    draw.rectangle([4, 2, 8, h - 4], fill=COLORS['black'])

    # Pages showing at the bottom/right
    draw.line([(w - 5, 4), (w - 5, h - 5)], fill=COLORS['black'])
    draw.line([(6, h - 3), (w - 7, h - 3)], fill=COLORS['black'])

    # Decorative element on cover (Scrapbook 'S')
    draw.text((12, 10), "S", fill=COLORS['white'])

    img = add_shadow(img)
    save_icon(img, 'scrapbook', 'icons/apps')

def generate_preferences_icon():
    """Generate System Preferences icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Control panel / gears
    # Main body
    draw.rectangle([4, 4, w - 5, h - 5], fill=COLORS['gray_light'], outline=COLORS['black'])

    # Gear 1
    draw.ellipse([8, 8, 18, 18], fill=COLORS['gray_medium'], outline=COLORS['black'])
    draw.ellipse([11, 11, 15, 15], fill=COLORS['gray_light'], outline=COLORS['black'])

    # Gear 2
    draw.ellipse([16, 16, 24, 24], fill=COLORS['gray_medium'], outline=COLORS['black'])
    draw.ellipse([19, 19, 21, 21], fill=COLORS['gray_light'], outline=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'preferences', 'icons/system')

def generate_solitaire_icon():
    """Generate Solitaire game icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Playing cards
    # Card 1 (back)
    draw.rectangle([4, 4, 20, 24], fill=COLORS['red'], outline=COLORS['black'])
    draw.rectangle([6, 6, 18, 22], outline=COLORS['white'])

    # Card 2 (front, slightly offset)
    draw.rectangle([10, 8, 26, 28], fill=COLORS['white'], outline=COLORS['black'])
    # Heart symbol
    draw.polygon([(18, 14), (20, 12), (22, 14), (18, 20), (14, 14), (16, 12)], fill=COLORS['red'])

    img = add_shadow(img)
    save_icon(img, 'solitaire', 'icons/apps')

def generate_puzzle_icon():
    """Generate Puzzle (sliding tile) game icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Puzzle frame
    draw.rectangle([3, 3, w - 4, h - 4], fill=COLORS['gray_light'], outline=COLORS['black'])

    # 3x3 grid of tiles (with one missing)
    tile_size = 7
    start_x = 5
    start_y = 5
    tile_num = 1
    for row in range(3):
        for col in range(3):
            if row == 2 and col == 2:
                # Empty space (bottom-right)
                continue
            x = start_x + col * (tile_size + 1)
            y = start_y + row * (tile_size + 1)
            draw.rectangle([x, y, x + tile_size, y + tile_size], fill=COLORS['white'], outline=COLORS['black'])
            # Draw number
            draw.text((x + 2, y + 1), str(tile_num), fill=COLORS['black'])
            tile_num += 1

    img = add_shadow(img)
    save_icon(img, 'puzzle', 'icons/apps')

def generate_paint_icon():
    """Generate Paint (MacPaint-style) application icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Canvas/paper background
    draw.rectangle([4, 4, w - 5, h - 5], fill=COLORS['white'], outline=COLORS['black'])

    # Paint brush
    # Brush handle
    draw.rectangle([6, 20, 10, 28], fill=COLORS['folder_yellow'], outline=COLORS['black'])
    # Brush bristles
    draw.rectangle([5, 16, 11, 20], fill=COLORS['gray_dark'], outline=COLORS['black'])

    # Paint stroke (colorful)
    draw.arc([12, 8, 26, 22], 0, 180, fill=COLORS['blue'], width=3)
    draw.line([(14, 12), (24, 18)], fill=COLORS['red'], width=2)

    # Color palette dots
    draw.ellipse([20, 22, 24, 26], fill=COLORS['red'], outline=COLORS['black'])
    draw.ellipse([24, 20, 28, 24], fill=COLORS['blue'], outline=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'paint', 'icons/apps')

def generate_eliza_icon():
    """Generate Eliza (computer therapist) application icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Computer/terminal shape
    draw.rectangle([4, 4, w - 5, h - 8], fill=COLORS['gray_light'], outline=COLORS['black'])

    # Screen
    draw.rectangle([6, 6, w - 7, h - 12], fill=COLORS['black'], outline=COLORS['black'])

    # Text lines on screen (conversation)
    draw.line([(8, 9), (16, 9)], fill=COLORS['green'])
    draw.line([(8, 13), (20, 13)], fill=COLORS['white'])
    draw.line([(8, 17), (14, 17)], fill=COLORS['green'])

    # Base/stand
    draw.rectangle([10, h - 7, w - 11, h - 4], fill=COLORS['gray_medium'], outline=COLORS['black'])

    # Speech bubble hint
    draw.ellipse([w - 12, 2, w - 4, 8], fill=COLORS['white'], outline=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'eliza', 'icons/apps')

def generate_tetris_icon():
    """Generate Tetris game icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Game field background
    draw.rectangle([4, 2, w - 5, h - 3], fill=COLORS['black'], outline=COLORS['gray_dark'])

    # Tetris blocks (various tetrominoes)
    block_size = 5

    # L-piece (orange/yellow)
    draw.rectangle([6, 4, 6 + block_size, 4 + block_size], fill=COLORS['yellow'], outline=COLORS['black'])
    draw.rectangle([6, 10, 6 + block_size, 10 + block_size], fill=COLORS['yellow'], outline=COLORS['black'])
    draw.rectangle([6, 16, 6 + block_size, 16 + block_size], fill=COLORS['yellow'], outline=COLORS['black'])
    draw.rectangle([12, 16, 12 + block_size, 16 + block_size], fill=COLORS['yellow'], outline=COLORS['black'])

    # T-piece (magenta)
    draw.rectangle([14, 4, 14 + block_size, 4 + block_size], fill=COLORS['magenta'], outline=COLORS['black'])
    draw.rectangle([20, 4, 20 + block_size, 4 + block_size], fill=COLORS['magenta'], outline=COLORS['black'])
    draw.rectangle([14, 10, 14 + block_size, 10 + block_size], fill=COLORS['magenta'], outline=COLORS['black'])

    # Square piece (cyan) at bottom
    draw.rectangle([18, 22, 18 + block_size, 22 + block_size], fill=COLORS['cyan'], outline=COLORS['black'])
    draw.rectangle([24, 22, 24 + block_size, 22 + block_size], fill=COLORS['cyan'], outline=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'tetris', 'icons/apps')

def generate_chat_icon():
    """Generate Chat/IM application icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Speech bubble 1 (left, larger)
    draw.ellipse([2, 4, 20, 18], fill=COLORS['white'], outline=COLORS['black'])
    # Bubble tail
    draw.polygon([(6, 16), (4, 22), (12, 16)], fill=COLORS['white'], outline=COLORS['black'])
    draw.line([(7, 16), (11, 16)], fill=COLORS['white'])

    # Text lines in bubble
    draw.line([(6, 9), (16, 9)], fill=COLORS['gray_dark'])
    draw.line([(6, 13), (14, 13)], fill=COLORS['gray_dark'])

    # Speech bubble 2 (right, smaller, overlapping)
    draw.ellipse([14, 12, 30, 24], fill=COLORS['cyan'], outline=COLORS['black'])
    # Bubble tail
    draw.polygon([(24, 22), (26, 28), (20, 22)], fill=COLORS['cyan'], outline=COLORS['black'])
    draw.line([(21, 22), (23, 22)], fill=COLORS['cyan'])

    # Text line in bubble 2
    draw.line([(18, 17), (26, 17)], fill=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'chat', 'icons/apps')

def generate_browser_icon():
    """Generate Browser application icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Globe shape
    draw.ellipse([4, 4, w - 5, h - 5], fill=COLORS['blue'], outline=COLORS['black'])

    # Latitude lines
    draw.arc([4, 10, w - 5, 22], 0, 180, fill=COLORS['white'])
    draw.arc([4, 4, w - 5, 16], 180, 360, fill=COLORS['white'])

    # Longitude line (vertical)
    draw.line([(w // 2, 5), (w // 2, h - 6)], fill=COLORS['white'])

    # Equator
    draw.line([(5, h // 2), (w - 6, h // 2)], fill=COLORS['white'])

    # Curved longitude lines
    draw.arc([8, 4, 18, h - 5], 90, 270, fill=COLORS['white'])
    draw.arc([14, 4, 24, h - 5], 270, 90, fill=COLORS['white'])

    img = add_shadow(img)
    save_icon(img, 'browser', 'icons/apps')

def generate_galaga_icon():
    """Generate Galaga (space shooter) game icon."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Space background
    draw.rectangle([3, 3, w - 4, h - 4], fill=COLORS['black'], outline=COLORS['gray_dark'])

    # Stars
    draw.point((8, 6), fill=COLORS['white'])
    draw.point((20, 8), fill=COLORS['white'])
    draw.point((12, 12), fill=COLORS['white'])
    draw.point((24, 16), fill=COLORS['white'])
    draw.point((6, 18), fill=COLORS['white'])

    # Player ship (bottom)
    draw.polygon([(16, 22), (12, 28), (20, 28)], fill=COLORS['cyan'], outline=COLORS['white'])

    # Enemy aliens (top)
    # Alien 1
    draw.rectangle([8, 6, 14, 10], fill=COLORS['red'], outline=COLORS['yellow'])
    draw.point((9, 8), fill=COLORS['white'])
    draw.point((12, 8), fill=COLORS['white'])

    # Alien 2
    draw.rectangle([18, 6, 24, 10], fill=COLORS['green'], outline=COLORS['yellow'])
    draw.point((19, 8), fill=COLORS['white'])
    draw.point((22, 8), fill=COLORS['white'])

    # Laser shot
    draw.line([(16, 14), (16, 20)], fill=COLORS['yellow'], width=1)

    img = add_shadow(img)
    save_icon(img, 'galaga', 'icons/apps')


# ============================================
# UI Elements
# ============================================

def generate_close_button():
    """Generate window close button."""
    img, draw = create_icon(size=(12, 12))

    # Button background
    draw.rectangle([0, 0, 11, 11], fill=COLORS['white'], outline=COLORS['black'])

    # 3D effect
    draw.line([(1, 1), (10, 1)], fill=COLORS['white'])
    draw.line([(1, 1), (1, 10)], fill=COLORS['white'])
    draw.line([(1, 10), (10, 10)], fill=COLORS['gray_dark'])
    draw.line([(10, 1), (10, 10)], fill=COLORS['gray_dark'])

    save_icon(img, 'close-button', 'icons/ui')

def generate_zoom_button():
    """Generate window zoom button."""
    img, draw = create_icon(size=(12, 12))

    # Button background
    draw.rectangle([0, 0, 11, 11], fill=COLORS['white'], outline=COLORS['black'])

    # Inner square (zoom indicator)
    draw.rectangle([3, 3, 8, 8], outline=COLORS['black'])

    save_icon(img, 'zoom-button', 'icons/ui')

def generate_collapse_button():
    """Generate window collapse/shade button."""
    img, draw = create_icon(size=(12, 12))

    # Button background
    draw.rectangle([0, 0, 11, 11], fill=COLORS['white'], outline=COLORS['black'])

    # Horizontal line (collapse indicator)
    draw.line([(3, 5), (8, 5)], fill=COLORS['black'])
    draw.line([(3, 6), (8, 6)], fill=COLORS['black'])

    save_icon(img, 'collapse-button', 'icons/ui')

def generate_resize_handle():
    """Generate window resize handle (grow box)."""
    img, draw = create_icon(size=(16, 16))

    # Diagonal lines pattern
    for i in range(4):
        offset = i * 4
        draw.line([(15 - offset, 15), (15, 15 - offset)], fill=COLORS['gray_dark'])
        draw.line([(14 - offset, 15), (15, 14 - offset)], fill=COLORS['white'])

    save_icon(img, 'resize-handle', 'icons/ui')

def generate_scrollbar_arrows():
    """Generate scrollbar arrow icons."""
    size = (16, 16)

    # Arrow Up
    img, draw = create_icon(size=size)
    draw.polygon([(8, 4), (4, 11), (12, 11)], fill=COLORS['black'])
    save_icon(img, 'scroll-arrow-up', 'icons/ui')

    # Arrow Down
    img, draw = create_icon(size=size)
    draw.polygon([(8, 11), (4, 4), (12, 4)], fill=COLORS['black'])
    save_icon(img, 'scroll-arrow-down', 'icons/ui')

    # Arrow Left
    img, draw = create_icon(size=size)
    draw.polygon([(4, 8), (11, 4), (11, 12)], fill=COLORS['black'])
    save_icon(img, 'scroll-arrow-left', 'icons/ui')

    # Arrow Right
    img, draw = create_icon(size=size)
    draw.polygon([(11, 8), (4, 4), (4, 12)], fill=COLORS['black'])
    save_icon(img, 'scroll-arrow-right', 'icons/ui')

def generate_scrollbar_thumb():
    """Generate scrollbar thumb (elevator) pattern."""
    img, draw = create_icon(size=(16, 16))

    # Main thumb body
    draw.rectangle([0, 0, 15, 15], fill=COLORS['white'], outline=COLORS['black'])

    # 3D highlight/shadow
    draw.line([(1, 1), (14, 1)], fill=COLORS['white'])
    draw.line([(1, 1), (1, 14)], fill=COLORS['white'])
    draw.line([(1, 14), (14, 14)], fill=COLORS['gray_dark'])
    draw.line([(14, 1), (14, 14)], fill=COLORS['gray_dark'])

    save_icon(img, 'scrollbar-thumb', 'icons/ui')

def generate_scrollbar_track():
    """Generate scrollbar track pattern."""
    # Scrollbar track in Mac OS 7 is often a 50% dithered gray pattern
    img, draw = create_icon(size=(16, 16))

    for y in range(16):
        for x in range(16):
            if (x + y) % 2 == 0:
                draw.point((x, y), fill=COLORS['white'])
            else:
                draw.point((x, y), fill=COLORS['gray_light'])

    save_icon(img, 'scrollbar-track', 'icons/ui')

def generate_checkboxes():
    """Generate checkbox icons (checked and unchecked)."""
    # Unchecked
    img, draw = create_icon(size=(12, 12))
    draw.rectangle([0, 0, 11, 11], fill=COLORS['white'], outline=COLORS['black'])
    # 3D inner shadow
    draw.line([(1, 1), (10, 1)], fill=COLORS['gray_medium'])
    draw.line([(1, 1), (1, 10)], fill=COLORS['gray_medium'])
    save_icon(img, 'checkbox-unchecked', 'icons/ui')

    # Checked
    img, draw = create_icon(size=(12, 12))
    draw.rectangle([0, 0, 11, 11], fill=COLORS['white'], outline=COLORS['black'])
    # 3D inner shadow
    draw.line([(1, 1), (10, 1)], fill=COLORS['gray_medium'])
    draw.line([(1, 1), (1, 10)], fill=COLORS['gray_medium'])
    # Checkmark (X-style or tick? Mac OS 7 uses a heavy checkmark)
    draw.line([(2, 4), (5, 9)], fill=COLORS['black'], width=2)
    draw.line([(5, 9), (9, 2)], fill=COLORS['black'], width=2)
    save_icon(img, 'checkbox-checked', 'icons/ui')

def generate_radio_buttons():
    """Generate radio button icons (selected and unselected)."""
    # Unselected
    img, draw = create_icon(size=(12, 12))
    draw.ellipse([0, 0, 11, 11], fill=COLORS['white'], outline=COLORS['black'])
    # 3D inner shadow
    draw.arc([1, 1, 10, 10], 180, 270, fill=COLORS['gray_medium'])
    save_icon(img, 'radio-unselected', 'icons/ui')

    # Selected
    img, draw = create_icon(size=(12, 12))
    draw.ellipse([0, 0, 11, 11], fill=COLORS['white'], outline=COLORS['black'])
    # 3D inner shadow
    draw.arc([1, 1, 10, 10], 180, 270, fill=COLORS['gray_medium'])
    # Inner dot
    draw.ellipse([3, 3, 8, 8], fill=COLORS['black'])
    save_icon(img, 'radio-selected', 'icons/ui')

def generate_cursors():
    """Generate system cursor graphics."""
    print('Generating cursors...')

    # Arrow cursor (standard)
    img, draw = create_icon(size=(16, 16))
    # Standard Mac arrow shape
    points = [
        (0, 0),
        (0, 15),
        (4, 11),
        (10, 11)
    ]
    draw.polygon(points, fill=COLORS['white'], outline=COLORS['black'])
    save_icon(img, 'cursor-arrow', 'cursors')

    # Text cursor (I-beam)
    img, draw = create_icon(size=(16, 16))
    draw.line([(8, 2), (8, 13)], fill=COLORS['black'])
    draw.line([(6, 2), (10, 2)], fill=COLORS['black'])
    draw.line([(6, 13), (10, 13)], fill=COLORS['black'])
    save_icon(img, 'cursor-text', 'cursors')

    # Wait cursor (Watch)
    img, draw = create_icon(size=(16, 16))
    # Watch face
    draw.ellipse([3, 3, 12, 12], fill=COLORS['white'], outline=COLORS['black'])
    # Watch hands
    draw.line([(7.5, 7.5), (7.5, 5)], fill=COLORS['black'])
    draw.line([(7.5, 7.5), (10, 7.5)], fill=COLORS['black'])
    # Watch stem
    draw.rectangle([6, 1, 9, 3], fill=COLORS['gray_medium'], outline=COLORS['black'])
    save_icon(img, 'cursor-wait', 'cursors')

    # Hand cursor (Pointer)
    img, draw = create_icon(size=(16, 16))
    # Simplified hand shape
    draw.rectangle([4, 6, 12, 14], fill=COLORS['white'], outline=COLORS['black'])
    draw.rectangle([4, 2, 6, 6], fill=COLORS['white'], outline=COLORS['black']) # Pointer finger
    save_icon(img, 'cursor-hand', 'cursors')

    print('Cursors complete!')

def generate_menu_bar_elements():
    """Generate menu bar related graphics."""
    print('Generating menu bar elements...')

    # Apple logo for menu bar
    img, draw = create_icon(size=(16, 16))
    # Very simplified Apple shape
    # Body
    draw.ellipse([3, 4, 13, 14], fill=COLORS['black'])
    # Bite
    draw.ellipse([10, 6, 15, 11], fill=(0, 0, 0, 0))
    # Stem
    draw.arc([6, 1, 10, 6], 0, 90, fill=COLORS['black'])
    save_icon(img, 'apple-logo', 'icons/ui')

    # Checkmark for menu items
    img, draw = create_icon(size=(12, 12))
    draw.line([(2, 5), (5, 8)], fill=COLORS['black'], width=2)
    draw.line([(5, 8), (10, 2)], fill=COLORS['black'], width=2)
    save_icon(img, 'menu-checkmark', 'icons/ui')

    print('Menu bar elements complete!')


# ============================================
# Boot/System Icons
# ============================================

def generate_happy_mac():
    """Generate Happy Mac boot icon."""
    img, draw = create_icon(size=(48, 48))
    w, h = 48, 48

    # Mac body
    draw.rounded_rectangle([8, 4, w - 9, h - 8], radius=4, fill=COLORS['gray_light'], outline=COLORS['black'])

    # Screen
    draw.rectangle([12, 8, w - 13, h - 18], fill=COLORS['white'], outline=COLORS['black'])

    # Happy face
    # Eyes
    draw.rectangle([18, 14, 22, 20], fill=COLORS['black'])
    draw.rectangle([26, 14, 30, 20], fill=COLORS['black'])

    # Nose
    draw.polygon([(23, 22), (25, 26), (21, 26)], fill=COLORS['black'])

    # Smile
    draw.arc([16, 24, 32, 32], 0, 180, fill=COLORS['black'], width=2)

    # Base
    draw.rectangle([16, h - 10, w - 17, h - 6], fill=COLORS['gray_medium'], outline=COLORS['black'])

    save_icon(img, 'happy-mac', 'icons/system')

def generate_sad_mac():
    """Generate Sad Mac error icon."""
    img, draw = create_icon(size=(48, 48))
    w, h = 48, 48

    # Mac body
    draw.rounded_rectangle([8, 4, w - 9, h - 8], radius=4, fill=COLORS['gray_light'], outline=COLORS['black'])

    # Screen (darker for error)
    draw.rectangle([12, 8, w - 13, h - 18], fill=COLORS['gray_dark'], outline=COLORS['black'])

    # Sad face (X eyes)
    # Left X eye
    draw.line([(17, 14), (23, 20)], fill=COLORS['black'], width=2)
    draw.line([(17, 20), (23, 14)], fill=COLORS['black'], width=2)

    # Right X eye
    draw.line([(25, 14), (31, 20)], fill=COLORS['black'], width=2)
    draw.line([(25, 20), (31, 14)], fill=COLORS['black'], width=2)

    # Frown
    draw.arc([16, 26, 32, 34], 180, 360, fill=COLORS['black'], width=2)

    # Base
    draw.rectangle([16, h - 10, w - 17, h - 6], fill=COLORS['gray_medium'], outline=COLORS['black'])

    save_icon(img, 'sad-mac', 'icons/system')


# ============================================
# Alert Dialog Icons
# ============================================

def generate_alert_stop_icon():
    """Generate Stop alert icon (red octagon with hand)."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Red octagon shape
    octagon_points = [
        (10, 2),
        (22, 2),
        (30, 10),
        (30, 22),
        (22, 30),
        (10, 30),
        (2, 22),
        (2, 10)
    ]
    draw.polygon(octagon_points, fill=COLORS['red'], outline=COLORS['black'])

    # Inner highlight
    inner_octagon = [
        (12, 5),
        (20, 5),
        (27, 12),
        (27, 20),
        (20, 27),
        (12, 27),
        (5, 20),
        (5, 12)
    ]
    draw.polygon(inner_octagon, outline=COLORS['white'])

    # Hand symbol (simplified stop hand)
    # Palm
    draw.rectangle([12, 10, 20, 22], fill=COLORS['white'], outline=COLORS['black'])
    # Fingers
    draw.rectangle([12, 6, 14, 10], fill=COLORS['white'], outline=COLORS['black'])
    draw.rectangle([15, 5, 17, 10], fill=COLORS['white'], outline=COLORS['black'])
    draw.rectangle([18, 6, 20, 10], fill=COLORS['white'], outline=COLORS['black'])
    # Thumb
    draw.rectangle([9, 12, 12, 16], fill=COLORS['white'], outline=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'alert-stop', 'icons/system')

def generate_alert_caution_icon():
    """Generate Caution alert icon (yellow triangle with exclamation)."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Yellow triangle
    triangle_points = [
        (16, 2),
        (30, 28),
        (2, 28)
    ]
    draw.polygon(triangle_points, fill=COLORS['yellow'], outline=COLORS['black'])

    # Inner border for 3D effect
    inner_triangle = [
        (16, 6),
        (26, 26),
        (6, 26)
    ]
    draw.polygon(inner_triangle, outline=COLORS['folder_dark'])

    # Exclamation mark
    # Stem
    draw.rectangle([14, 10, 18, 20], fill=COLORS['black'])
    # Dot
    draw.rectangle([14, 23, 18, 27], fill=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'alert-caution', 'icons/system')

def generate_alert_note_icon():
    """Generate Note alert icon (speech bubble with 'i')."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Speech bubble / rounded rectangle
    draw.rounded_rectangle([2, 2, 30, 24], radius=4, fill=COLORS['blue'], outline=COLORS['black'])

    # Bubble tail
    tail_points = [
        (8, 24),
        (6, 30),
        (14, 24)
    ]
    draw.polygon(tail_points, fill=COLORS['blue'], outline=COLORS['black'])
    # Cover the outline inside bubble
    draw.line([(9, 24), (13, 24)], fill=COLORS['blue'])

    # "i" for information
    # Dot
    draw.ellipse([14, 6, 18, 10], fill=COLORS['white'])
    # Stem
    draw.rectangle([14, 12, 18, 21], fill=COLORS['white'])
    # Serifs
    draw.rectangle([12, 12, 20, 14], fill=COLORS['white'])
    draw.rectangle([12, 19, 20, 21], fill=COLORS['white'])

    img = add_shadow(img)
    save_icon(img, 'alert-note', 'icons/system')

def generate_sharing_icon():
    """Generate sharing/multiuser icon (two heads)."""
    img, draw = create_icon()
    w, h = ICON_SIZE_STANDARD

    # Person 1 (back, gray)
    # Head
    draw.ellipse([14, 4, 26, 16], fill=COLORS['gray_medium'], outline=COLORS['black'])
    # Body
    draw.polygon([(10, 24), (30, 24), (28, 16), (12, 16)], fill=COLORS['gray_medium'], outline=COLORS['black'])

    # Person 2 (front, white)
    # Head
    draw.ellipse([6, 8, 18, 20], fill=COLORS['white'], outline=COLORS['black'])
    # Body
    draw.polygon([(2, 28), (22, 28), (20, 20), (4, 20)], fill=COLORS['white'], outline=COLORS['black'])

    img = add_shadow(img)
    save_icon(img, 'sharing', 'icons/system')

def generate_avatar_icons():
    """Generate a set of simple avatar icons."""
    print('Generating avatar icons...')
    # Avatar 1: Classic Mac
    img, draw = create_icon()
    # Screen
    draw.rectangle([6, 6, 26, 22], fill=COLORS['white'], outline=COLORS['black'], width=2)
    # Smile
    draw.line([(12, 16), (14, 18), (18, 18), (20, 16)], fill=COLORS['black'], width=1)
    # Eyes
    draw.point([(12, 12), (20, 12)], fill=COLORS['black'])
    # Case base
    draw.polygon([(4, 22), (28, 22), (30, 28), (2, 28)], fill=COLORS['gray_light'], outline=COLORS['black'])
    save_icon(img, 'avatar-mac', 'icons/avatars')

    # Avatar 2: Floppy
    img, draw = create_icon()
    draw.rectangle([4, 4, 28, 28], fill=COLORS['blue'], outline=COLORS['black'])
    draw.rectangle([8, 4, 24, 14], fill=COLORS['white'], outline=COLORS['black'])
    draw.rectangle([10, 18, 22, 28], fill=COLORS['gray_light'], outline=COLORS['black'])
    save_icon(img, 'avatar-floppy', 'icons/avatars')

    # Avatar 3: Apple
    img, draw = create_icon()
    draw.ellipse([8, 10, 24, 26], fill=COLORS['red'], outline=COLORS['black'])
    draw.polygon([(16, 6), (20, 2), (22, 6)], fill=COLORS['green'], outline=COLORS['black'])
    save_icon(img, 'avatar-apple', 'icons/avatars')

    print('Avatar icons complete!')


# ============================================
# Main Generation Functions
# ============================================

def generate_system_icons():
    """Generate all system icons."""
    print('Generating system icons...')
    generate_folder_icon()
    generate_folder_open_icon()
    generate_document_icon()
    generate_trash_empty_icon()
    generate_trash_full_icon()
    generate_hard_drive_icon()
    generate_finder_icon()
    generate_application_icon()
    generate_happy_mac()
    generate_sad_mac()
    generate_alert_stop_icon()
    generate_alert_caution_icon()
    generate_alert_note_icon()
    generate_sharing_icon()
    generate_preferences_icon()
    print('System icons complete!')

def generate_app_icons():
    """Generate all application icons."""
    print('Generating application icons...')
    generate_calculator_icon()
    generate_simpletext_icon()
    generate_notepad_icon()
    generate_scrapbook_icon()
    generate_solitaire_icon()
    generate_puzzle_icon()
    generate_paint_icon()
    generate_eliza_icon()
    generate_tetris_icon()
    generate_chat_icon()
    generate_browser_icon()
    generate_galaga_icon()
    print('Application icons complete!')

def generate_progress_bar_elements():
    """Generate progress bar related graphics."""
    print('Generating progress bar elements...')

    # Progress bar track
    img, draw = create_icon(size=(32, 12))
    draw.rectangle([0, 0, 31, 11], fill=COLORS['white'], outline=COLORS['black'])
    save_icon(img, 'progress-track', 'icons/ui')

    # Progress bar fill (dithered)
    img, draw = create_icon(size=(32, 12))
    for y in range(12):
        for x in range(32):
            if (x + y) % 2 == 0:
                draw.point((x, y), fill=COLORS['black'])
            else:
                draw.point((x, y), fill=COLORS['gray_dark'])
    save_icon(img, 'progress-fill', 'icons/ui')

    print('Progress bar elements complete!')

def generate_ui_icons():
    """Generate all UI element icons."""
    print('Generating UI icons...')
    generate_close_button()
    generate_zoom_button()
    generate_collapse_button()
    generate_resize_handle()
    generate_scrollbar_arrows()
    generate_scrollbar_thumb()
    generate_scrollbar_track()
    generate_checkboxes()
    generate_radio_buttons()
    generate_cursors()
    generate_menu_bar_elements()
    generate_progress_bar_elements()
    print('UI icons complete!')

def generate_small_system_icons():
    """Generate 16x16 small versions of system icons."""
    print('Generating small system icons...')
    size = ICON_SIZE_SMALL

    # Folder
    img, draw = create_icon(size=size)
    draw_folder_base(draw, size=size)
    save_icon(img, 'folder-16', 'icons/system')

    # Open Folder
    img, draw = create_icon(size=size)
    # Simple open folder for 16x16
    draw.rectangle([1, 4, 14, 13], fill=COLORS['folder_yellow'], outline=COLORS['black'])
    draw.line([(1, 4), (5, 4)], fill=COLORS['folder_dark'])
    save_icon(img, 'folder-open-16', 'icons/system')

    # Document
    img, draw = create_icon(size=size)
    draw_document_base(draw, size=size)
    save_icon(img, 'document-16', 'icons/system')

    # Trash Empty
    img, draw = create_icon(size=size)
    draw_trash_base(draw, size=size, is_full=False)
    save_icon(img, 'trash-empty-16', 'icons/system')

    # Trash Full
    img, draw = create_icon(size=size)
    draw_trash_base(draw, size=size, is_full=True)
    save_icon(img, 'trash-full-16', 'icons/system')

    # Sharing
    img, draw = create_icon(size=size)
    # Person 1 (back)
    draw.ellipse([6, 2, 12, 8], fill=COLORS['gray_medium'], outline=COLORS['black'])
    draw.polygon([(4, 12), (14, 12), (12, 8), (6, 8)], fill=COLORS['gray_medium'], outline=COLORS['black'])
    # Person 2 (front)
    draw.ellipse([2, 5, 8, 11], fill=COLORS['white'], outline=COLORS['black'])
    draw.polygon([(0, 15), (10, 15), (8, 11), (2, 11)], fill=COLORS['white'], outline=COLORS['black'])
    save_icon(img, 'sharing-16', 'icons/system')

    print('Small system icons complete!')

def generate_miscellaneous_graphics():
    """Generate miscellaneous system graphics."""
    print('Generating miscellaneous graphics...')

    # Dialog box border (small sample to show the style)
    # Mac OS 7 dialogs have a 2px black border, then a 1px white, then 1px black
    img, draw = create_icon(size=(32, 32))
    draw.rectangle([0, 0, 31, 31], fill=COLORS['white'], outline=COLORS['black'], width=2)
    draw.rectangle([3, 3, 28, 28], outline=COLORS['black'], width=1)
    save_icon(img, 'dialog-border-sample', 'icons/ui')

    print('Miscellaneous graphics complete!')

def generate_all_icons():
    """Generate all icons."""
    generate_system_icons()
    generate_small_system_icons()
    generate_app_icons()
    generate_avatar_icons()
    generate_ui_icons()
    generate_miscellaneous_graphics()
    print('\nAll icons generated successfully!')


# ============================================
# CLI Entry Point
# ============================================

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Generate Mac OS 7 style icons')
    parser.add_argument('--all', action='store_true', help='Generate all icons')
    parser.add_argument('--system', action='store_true', help='Generate system icons only')
    parser.add_argument('--small', action='store_true', help='Generate small icons only')
    parser.add_argument('--apps', action='store_true', help='Generate application icons only')
    parser.add_argument('--ui', action='store_true', help='Generate UI icons only')

    args = parser.parse_args()

    if args.system:
        generate_system_icons()
    elif args.small:
        generate_small_system_icons()
    elif args.apps:
        generate_app_icons()
    elif args.ui:
        generate_ui_icons()
    else:
        # Default: generate all
        generate_all_icons()
