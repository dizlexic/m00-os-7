from PIL import Image, ImageDraw, ImageFont
import os
from asset_utils import COLORS, get_output_dir

CARD_SIZE = (40, 60)
SUITS = ['spades', 'hearts', 'diamonds', 'clubs']
RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

def draw_suit(draw, suit, pos, size=10):
    x, y = pos
    color = COLORS['red'] if suit in ['hearts', 'diamonds'] else COLORS['black']

    if suit == 'hearts':
        draw.polygon([(x+size//2, y+size), (x, y+size//3), (x+size//4, y), (x+size//2, y+size//4), (x+3*size//4, y), (x+size, y+size//3)], fill=color)
    elif suit == 'diamonds':
        draw.polygon([(x+size//2, y), (x+size, y+size//2), (x+size//2, y+size), (x, y+size//2)], fill=color)
    elif suit == 'spades':
        # Upside down heart with stem
        draw.polygon([(x+size//2, y), (x, y+2*size//3), (x+size//4, y+size), (x+size//2, y+3*size//4), (x+3*size//4, y+size), (x+size, y+2*size//3)], fill=color)
        draw.rectangle([x+size//2-1, y+3*size//4, x+size//2+1, y+size], fill=color)
    elif suit == 'clubs':
        # Three circles with stem
        r = size // 3
        draw.ellipse([x+size//2-r, y, x+size//2+r, y+2*r], fill=color) # Top
        draw.ellipse([x, y+size//2-r, x+2*r, y+size//2+r], fill=color) # Left
        draw.ellipse([x+size-2*r, y+size//2-r, x+size, y+size//2+r], fill=color) # Right
        draw.rectangle([x+size//2-1, y+size//2, x+size//2+1, y+size], fill=color) # Stem

def generate_cards():
    output_dir = get_output_dir('cards')

    # Generate card back
    back_img = Image.new('RGBA', CARD_SIZE, COLORS['white'])
    back_draw = ImageDraw.Draw(back_img)
    # Border
    back_draw.rectangle([0, 0, CARD_SIZE[0]-1, CARD_SIZE[1]-1], outline=COLORS['black'])
    # Pattern
    for x in range(2, CARD_SIZE[0]-2, 4):
        for y in range(2, CARD_SIZE[1]-2, 4):
            back_draw.point((x, y), fill=COLORS['blue'])
            back_draw.point((x+1, y+1), fill=COLORS['blue'])
    back_img.save(os.path.join(output_dir, 'back.png'))

    for suit in SUITS:
        for rank in RANKS:
            img = Image.new('RGBA', CARD_SIZE, COLORS['white'])
            draw = ImageDraw.Draw(img)

            # Border
            draw.rectangle([0, 0, CARD_SIZE[0]-1, CARD_SIZE[1]-1], outline=COLORS['black'])

            color = COLORS['red'] if suit in ['hearts', 'diamonds'] else COLORS['black']

            # Rank (top left)
            draw.text((3, 2), rank, fill=color)

            # Suit (below rank)
            draw_suit(draw, suit, (3, 15), size=8)

            # Larger Suit (center)
            draw_suit(draw, suit, (CARD_SIZE[0]//2-8, CARD_SIZE[1]//2-8), size=16)

            # Save
            name = f"{suit}_{rank.lower()}.png"
            img.save(os.path.join(output_dir, name))

if __name__ == '__main__':
    generate_cards()
    print("Cards generated successfully!")
