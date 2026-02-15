#!/usr/bin/env python3
"""
m00-os-7 Desktop Pattern Generator

Generates Mac OS 7 style desktop background patterns using PIL.
Patterns are typically 8x8 or 16x16 tiles that repeat.
"""

import sys
import os

# Add scripts directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from asset_utils import COLORS, get_output_dir
from PIL import Image, ImageDraw

def save_pattern(img, name):
    output_dir = get_output_dir('patterns')
    filepath = os.path.join(output_dir, f'{name}.png')
    img.save(filepath, 'PNG')
    print(f'Saved pattern: {filepath}')

def create_pattern_tile(size=(16, 16)):
    img = Image.new('RGB', size, COLORS['white'])
    draw = ImageDraw.Draw(img)
    return img, draw

def generate_standard_gray():
    """Classic 50% dithered gray pattern."""
    img, draw = create_pattern_tile((8, 8))
    for y in range(8):
        for x in range(8):
            if (x + y) % 2 == 0:
                draw.point((x, y), fill=COLORS['white'])
            else:
                draw.point((x, y), fill=COLORS['gray_light'])
    save_pattern(img, 'gray-dither')

def generate_stripes():
    """Classic vertical stripes."""
    img, draw = create_pattern_tile((8, 8))
    for x in range(8):
        color = COLORS['desktop_blue'] if x % 2 == 0 else COLORS['white']
        draw.line([(x, 0), (x, 7)], fill=color)
    save_pattern(img, 'stripes-vertical')

def generate_dots():
    """Simple polka dots."""
    img, draw = create_pattern_tile((16, 16))
    img.paste(COLORS['desktop_blue'], [0, 0, 16, 16])
    draw = ImageDraw.Draw(img)
    for y in range(0, 16, 4):
        for x in range(0, 16, 4):
            if (x + y) % 8 == 0:
                draw.point((x, y), fill=COLORS['white'])
    save_pattern(img, 'polka-dots')

def generate_bricks():
    """Brick-like pattern."""
    img, draw = create_pattern_tile((16, 16))
    img.paste(COLORS['gray_medium'], [0, 0, 16, 16])
    draw = ImageDraw.Draw(img)
    # Horizontal lines
    draw.line([(0, 7), (15, 7)], fill=COLORS['black'])
    draw.line([(0, 15), (15, 15)], fill=COLORS['black'])
    # Vertical lines (staggered)
    draw.line([(7, 0), (7, 7)], fill=COLORS['black'])
    draw.line([(15, 8), (15, 15)], fill=COLORS['black'])
    save_pattern(img, 'bricks')

def generate_blueprint():
    """Grid/blueprint pattern."""
    img, draw = create_pattern_tile((16, 16))
    img.paste(COLORS['blue'], [0, 0, 16, 16])
    draw = ImageDraw.Draw(img)
    draw.line([(0, 0), (15, 0)], fill=COLORS['cyan'])
    draw.line([(0, 0), (0, 15)], fill=COLORS['cyan'])
    save_pattern(img, 'blueprint')

def generate_waves():
    """Simple wave pattern."""
    img, draw = create_pattern_tile((16, 16))
    for y in range(16):
        for x in range(16):
            if (x // 4 + y // 2) % 2 == 0:
                draw.point((x, y), fill=COLORS['gray_light'])
            else:
                draw.point((x, y), fill=COLORS['white'])
    save_pattern(img, 'waves')

def generate_checkerboard():
    """Small checkerboard."""
    img, draw = create_pattern_tile((8, 8))
    for y in range(8):
        for x in range(8):
            if ((x // 2) + (y // 2)) % 2 == 0:
                draw.point((x, y), fill=COLORS['black'])
            else:
                draw.point((x, y), fill=COLORS['white'])
    save_pattern(img, 'checkerboard')

def generate_circuit():
    """Circuit board-like dots and lines."""
    img, draw = create_pattern_tile((16, 16))
    img.paste(COLORS['green'], [0, 0, 16, 16])
    draw = ImageDraw.Draw(img)
    # Pads
    draw.point((4, 4), fill=COLORS['yellow'])
    draw.point((12, 12), fill=COLORS['yellow'])
    # Traces
    draw.line([(4, 4), (4, 12), (12, 12)], fill=COLORS['white'])
    save_pattern(img, 'circuit')

def generate_diagonal():
    """Diagonal stripes."""
    img, draw = create_pattern_tile((8, 8))
    for y in range(8):
        for x in range(8):
            if (x + y) % 4 == 0:
                draw.point((x, y), fill=COLORS['magenta'])
            else:
                draw.point((x, y), fill=COLORS['white'])
    save_pattern(img, 'diagonal')

def generate_maze():
    """Maze-like pattern."""
    img, draw = create_pattern_tile((16, 16))
    for y in range(0, 16, 4):
        for x in range(0, 16, 4):
            if (x + y) % 8 == 0:
                draw.line([(x, y), (x + 3, y + 3)], fill=COLORS['black'])
            else:
                draw.line([(x, y + 3), (x + 3, y)], fill=COLORS['black'])
    save_pattern(img, 'maze')

def generate_all():
    print('Generating desktop patterns...')
    generate_standard_gray()
    generate_stripes()
    generate_dots()
    generate_bricks()
    generate_blueprint()
    generate_waves()
    generate_checkerboard()
    generate_circuit()
    generate_diagonal()
    generate_maze()
    print('All patterns generated successfully!')

if __name__ == '__main__':
    generate_all()
