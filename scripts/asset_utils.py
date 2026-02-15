"""
m00-os-7 Asset Generation Utilities

Base utilities for generating Mac OS 7 style assets using PIL.
Includes color palette, icon templates, and common drawing functions.
"""

from PIL import Image, ImageDraw
from typing import Tuple, Optional
import os

# ============================================
# Mac OS 7 Color Palette (Classic 16-color)
# ============================================

COLORS = {
    # Primary colors
    'black': (0, 0, 0),
    'white': (255, 255, 255),

    # Grayscale
    'gray_light': (204, 204, 204),
    'gray_medium': (153, 153, 153),
    'gray_dark': (102, 102, 102),

    # System colors
    'blue': (0, 0, 128),
    'cyan': (0, 255, 255),
    'green': (0, 255, 0),
    'magenta': (255, 0, 255),
    'red': (255, 0, 0),
    'yellow': (255, 255, 0),

    # Additional Mac OS 7 colors
    'desktop_blue': (102, 102, 153),
    'highlight': (0, 0, 128),
    'window_bg': (204, 204, 204),
    'title_bar_active': (0, 0, 0),
    'title_bar_inactive': (153, 153, 153),

    # Folder colors
    'folder_yellow': (255, 204, 0),
    'folder_dark': (204, 153, 0),

    # Document colors
    'document_white': (255, 255, 255),
    'document_fold': (204, 204, 204),
}

# ============================================
# Icon Sizes
# ============================================

ICON_SIZE_SMALL = (16, 16)
ICON_SIZE_STANDARD = (32, 32)
ICON_SIZE_LARGE = (48, 48)

# ============================================
# Output Directories
# ============================================

def get_output_dir(subdir: str = '') -> str:
    """Get the output directory for generated assets."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(base_dir, 'public', 'assets')
    if subdir:
        output_dir = os.path.join(output_dir, subdir)
    os.makedirs(output_dir, exist_ok=True)
    return output_dir

# ============================================
# Image Creation Utilities
# ============================================

def create_icon(
    size: Tuple[int, int] = ICON_SIZE_STANDARD,
    background: Optional[Tuple[int, int, int, int]] = None
) -> Tuple[Image.Image, ImageDraw.ImageDraw]:
    """
    Create a new icon image with transparent background.

    Args:
        size: Icon dimensions (width, height)
        background: Optional RGBA background color

    Returns:
        Tuple of (Image, ImageDraw) objects
    """
    if background is None:
        background = (0, 0, 0, 0)  # Transparent

    img = Image.new('RGBA', size, background)
    draw = ImageDraw.Draw(img)
    return img, draw

def add_shadow(
    img: Image.Image,
    offset: Tuple[int, int] = (1, 1),
    shadow_color: Tuple[int, int, int, int] = (0, 0, 0, 128)
) -> Image.Image:
    """
    Add a drop shadow to an image.

    Args:
        img: Source image
        offset: Shadow offset (x, y)
        shadow_color: RGBA shadow color

    Returns:
        New image with shadow
    """
    # Create shadow layer
    shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))

    # Get alpha channel from original
    if img.mode == 'RGBA':
        alpha = img.split()[3]
        shadow_alpha = alpha.point(lambda x: min(x, shadow_color[3]))
        shadow.putalpha(shadow_alpha)

        # Offset the shadow
        shadow_offset = Image.new('RGBA', img.size, (0, 0, 0, 0))
        shadow_offset.paste(shadow, offset)

        # Composite shadow under original
        result = Image.alpha_composite(shadow_offset, img)
        return result

    return img

def add_highlight(
    draw: ImageDraw.ImageDraw,
    rect: Tuple[int, int, int, int],
    light_color: Tuple[int, int, int] = COLORS['white'],
    dark_color: Tuple[int, int, int] = COLORS['gray_dark']
) -> None:
    """
    Add Mac OS 7 style 3D highlight/shadow effect to a rectangle.

    Args:
        draw: ImageDraw object
        rect: Rectangle bounds (x1, y1, x2, y2)
        light_color: Color for top/left edges
        dark_color: Color for bottom/right edges
    """
    x1, y1, x2, y2 = rect

    # Top and left edges (light)
    draw.line([(x1, y1), (x2, y1)], fill=light_color)
    draw.line([(x1, y1), (x1, y2)], fill=light_color)

    # Bottom and right edges (dark)
    draw.line([(x1, y2), (x2, y2)], fill=dark_color)
    draw.line([(x2, y1), (x2, y2)], fill=dark_color)

def draw_border(
    draw: ImageDraw.ImageDraw,
    rect: Tuple[int, int, int, int],
    color: Tuple[int, int, int] = COLORS['black'],
    width: int = 1
) -> None:
    """
    Draw a border around a rectangle.

    Args:
        draw: ImageDraw object
        rect: Rectangle bounds (x1, y1, x2, y2)
        color: Border color
        width: Border width
    """
    x1, y1, x2, y2 = rect
    for i in range(width):
        draw.rectangle([x1 + i, y1 + i, x2 - i, y2 - i], outline=color)

def save_icon(img: Image.Image, name: str, subdir: str = 'icons') -> str:
    """
    Save an icon to the output directory.

    Args:
        img: Image to save
        name: Filename (without extension)
        subdir: Subdirectory within assets

    Returns:
        Full path to saved file
    """
    output_dir = get_output_dir(subdir)
    filepath = os.path.join(output_dir, f'{name}.png')
    img.save(filepath, 'PNG')
    print(f'Saved: {filepath}')
    return filepath

# ============================================
# Common Icon Drawing Functions
# ============================================

def draw_folder_base(
    draw: ImageDraw.ImageDraw,
    size: Tuple[int, int] = ICON_SIZE_STANDARD,
    fill_color: Tuple[int, int, int] = COLORS['folder_yellow'],
    dark_color: Tuple[int, int, int] = COLORS['folder_dark']
) -> None:
    """
    Draw a basic folder shape.

    Args:
        draw: ImageDraw object
        size: Icon size
        fill_color: Main folder color
        dark_color: Darker shade for depth
    """
    w, h = size

    # Tab on top
    tab_points = [
        (2, 6),
        (2, 3),
        (12, 3),
        (14, 6)
    ]
    draw.polygon(tab_points, fill=fill_color, outline=COLORS['black'])

    # Main folder body
    body_rect = [2, 6, w - 3, h - 3]
    draw.rectangle(body_rect, fill=fill_color, outline=COLORS['black'])

    # Add 3D effect
    draw.line([(3, 7), (w - 4, 7)], fill=COLORS['white'])
    draw.line([(3, 7), (3, h - 4)], fill=COLORS['white'])
    draw.line([(3, h - 4), (w - 4, h - 4)], fill=dark_color)
    draw.line([(w - 4, 7), (w - 4, h - 4)], fill=dark_color)

def draw_document_base(
    draw: ImageDraw.ImageDraw,
    size: Tuple[int, int] = ICON_SIZE_STANDARD,
    fill_color: Tuple[int, int, int] = COLORS['white']
) -> None:
    """
    Draw a basic document shape with folded corner.

    Args:
        draw: ImageDraw object
        size: Icon size
        fill_color: Document background color
    """
    w, h = size
    fold_size = 6

    # Document outline points (with folded corner)
    points = [
        (4, 2),
        (w - 4 - fold_size, 2),
        (w - 4, 2 + fold_size),
        (w - 4, h - 2),
        (4, h - 2)
    ]
    draw.polygon(points, fill=fill_color, outline=COLORS['black'])

    # Folded corner
    fold_points = [
        (w - 4 - fold_size, 2),
        (w - 4 - fold_size, 2 + fold_size),
        (w - 4, 2 + fold_size)
    ]
    draw.polygon(fold_points, fill=COLORS['gray_light'], outline=COLORS['black'])

    # Document lines (text representation)
    line_y = 10
    while line_y < h - 6:
        draw.line([(8, line_y), (w - 8, line_y)], fill=COLORS['gray_medium'])
        line_y += 3

def draw_trash_base(
    draw: ImageDraw.ImageDraw,
    size: Tuple[int, int] = ICON_SIZE_STANDARD,
    is_full: bool = False
) -> None:
    """
    Draw a trash can icon.

    Args:
        draw: ImageDraw object
        size: Icon size
        is_full: Whether trash contains items
    """
    w, h = size

    # Trash can body
    body_color = COLORS['gray_light'] if not is_full else COLORS['gray_medium']

    # Lid
    draw.rectangle([6, 4, w - 7, 7], fill=COLORS['gray_medium'], outline=COLORS['black'])
    draw.rectangle([12, 2, w - 13, 4], fill=COLORS['gray_medium'], outline=COLORS['black'])

    # Body (tapered)
    body_points = [
        (8, 8),
        (w - 9, 8),
        (w - 10, h - 3),
        (9, h - 3)
    ]
    draw.polygon(body_points, fill=body_color, outline=COLORS['black'])

    # Vertical lines on body
    draw.line([(12, 10), (11, h - 5)], fill=COLORS['gray_dark'])
    draw.line([(w // 2, 10), (w // 2, h - 5)], fill=COLORS['gray_dark'])
    draw.line([(w - 13, 10), (w - 12, h - 5)], fill=COLORS['gray_dark'])

    # If full, add some paper sticking out
    if is_full:
        draw.polygon([(10, 6), (14, 2), (18, 6)], fill=COLORS['white'], outline=COLORS['black'])

# ============================================
# Main execution (for testing)
# ============================================

if __name__ == '__main__':
    print('Asset utilities loaded successfully.')
    print(f'Output directory: {get_output_dir()}')
    print(f'Available colors: {list(COLORS.keys())}')
