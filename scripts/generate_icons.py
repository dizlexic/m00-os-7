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
    print('System icons complete!')

def generate_app_icons():
    """Generate all application icons."""
    print('Generating application icons...')
    generate_calculator_icon()
    generate_simpletext_icon()
    generate_notepad_icon()
    print('Application icons complete!')

def generate_ui_icons():
    """Generate all UI element icons."""
    print('Generating UI icons...')
    generate_close_button()
    generate_zoom_button()
    generate_collapse_button()
    generate_resize_handle()
    print('UI icons complete!')

def generate_all_icons():
    """Generate all icons."""
    generate_system_icons()
    generate_app_icons()
    generate_ui_icons()
    print('\nAll icons generated successfully!')


# ============================================
# CLI Entry Point
# ============================================

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Generate Mac OS 7 style icons')
    parser.add_argument('--all', action='store_true', help='Generate all icons')
    parser.add_argument('--system', action='store_true', help='Generate system icons only')
    parser.add_argument('--apps', action='store_true', help='Generate application icons only')
    parser.add_argument('--ui', action='store_true', help='Generate UI icons only')

    args = parser.parse_args()

    if args.system:
        generate_system_icons()
    elif args.apps:
        generate_app_icons()
    elif args.ui:
        generate_ui_icons()
    else:
        # Default: generate all
        generate_all_icons()
