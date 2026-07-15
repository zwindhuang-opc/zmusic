from PIL import Image, ImageDraw, ImageFont
import os

BASE_COLORS = {
    'dark': (30, 10, 45),
    'purple': (139, 92, 246),
    'pink': (236, 72, 153),
    'light': (168, 85, 247),
    'white': (255, 255, 255),
}

def create_gradient_background(size, colors):
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    width, height = size
    for y in range(height):
        t = y / (height - 1)
        r = int(colors[0][0] * (1 - t) + colors[1][0] * t)
        g = int(colors[0][1] * (1 - t) + colors[1][1] * t)
        b = int(colors[0][2] * (1 - t) + colors[1][2] * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
    
    return img

def draw_music_note(draw, center_x, center_y, size, color):
    scale = size / 100
    
    note_head = [
        (center_x - 15 * scale, center_y - 15 * scale),
        (center_x + 15 * scale, center_y - 15 * scale),
        (center_x + 15 * scale, center_y + 5 * scale),
        (center_x - 5 * scale, center_y + 15 * scale),
        (center_x - 15 * scale, center_y + 5 * scale),
    ]
    
    stem_x = center_x + 15 * scale
    stem_top = center_y - 55 * scale
    stem_bottom = center_y + 15 * scale
    
    draw.polygon(note_head, fill=color)
    
    draw.line([(stem_x, stem_top), (stem_x, stem_bottom)], fill=color, width=int(6 * scale))
    
    flag_points = [
        (stem_x, stem_top),
        (stem_x + 25 * scale, stem_top - 15 * scale),
        (stem_x + 20 * scale, stem_top + 5 * scale),
        (stem_x, stem_top + 10 * scale),
    ]
    draw.polygon(flag_points, fill=color)

def draw_wave_pattern(draw, center_x, center_y, size, color, opacity=128):
    scale = size / 100
    color_with_alpha = color + (opacity,)
    
    for i in range(3):
        y_offset = (i - 1) * 20 * scale
        points = []
        for x in range(0, int(80 * scale), 5):
            t = x / (80 * scale)
            y = center_y + y_offset + int(15 * scale * (1 - t) * abs(t - 0.5) * 4)
            points.append((center_x - 40 * scale + x, y))
        
        draw.line(points, fill=color_with_alpha, width=int(3 * scale))

def create_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    bg = create_gradient_background((size, size), [BASE_COLORS['dark'], BASE_COLORS['purple']])
    img.paste(bg, (0, 0))
    
    padding = size * 0.2
    content_size = size - padding * 2
    
    inner_circle_radius = content_size * 0.45
    center_x = size // 2
    center_y = size // 2
    
    gradient_inner = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw_inner = ImageDraw.Draw(gradient_inner)
    
    for r in range(int(inner_circle_radius), 0, -1):
        t = 1 - (r / inner_circle_radius)
        alpha = int(100 * (1 - t) + 20 * t)
        r_color = int(BASE_COLORS['light'][0] * (1 - t) + BASE_COLORS['purple'][0] * t)
        g_color = int(BASE_COLORS['light'][1] * (1 - t) + BASE_COLORS['purple'][1] * t)
        b_color = int(BASE_COLORS['light'][2] * (1 - t) + BASE_COLORS['purple'][2] * t)
        
        draw_inner.ellipse(
            [center_x - r, center_y - r, center_x + r, center_y + r],
            fill=(r_color, g_color, b_color, alpha)
        )
    
    img.alpha_composite(gradient_inner)
    
    draw_music_note(draw, center_x, center_y, content_size * 0.6, BASE_COLORS['white'])
    
    draw_wave_pattern(draw, center_x, center_y + content_size * 0.35, content_size, BASE_COLORS['white'])
    
    glow_radius = int(content_size * 0.15)
    for r in range(glow_radius, 0, -1):
        alpha = int(30 * (r / glow_radius))
        draw.ellipse(
            [center_x - r, center_y - r, center_x + r, center_y + r],
            fill=(BASE_COLORS['pink'][0], BASE_COLORS['pink'][1], BASE_COLORS['pink'][2], alpha)
        )
    
    return img

def main():
    icons = [
        ('public/logo192.png', 192),
        ('public/logo512.png', 512),
        ('resources/icons/icon-16.png', 16),
        ('resources/icons/icon-24.png', 24),
        ('resources/icons/icon-32.png', 32),
        ('resources/icons/icon-48.png', 48),
        ('resources/icons/icon-64.png', 64),
        ('resources/icons/icon-128.png', 128),
        ('resources/icons/icon-256.png', 256),
        ('resources/icons/icon-512.png', 512),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_20x20.png', 20),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_29x29.png', 29),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_40x40.png', 40),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_58x58.png', 58),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_60x60.png', 60),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_76x76.png', 76),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_80x80.png', 80),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_87x87.png', 87),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_120x120.png', 120),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_152x152.png', 152),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_167x167.png', 167),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_180x180.png', 180),
        ('ios/App/App/Assets.xcassets/AppIcon.appiconset/icon_1024x1024.png', 1024),
        ('android/app/src/main/res/mipmap-mdpi/ic_launcher.png', 48),
        ('android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png', 48),
        ('android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png', 48),
        ('android/app/src/main/res/mipmap-hdpi/ic_launcher.png', 72),
        ('android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png', 72),
        ('android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png', 72),
        ('android/app/src/main/res/mipmap-xhdpi/ic_launcher.png', 96),
        ('android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', 96),
        ('android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png', 96),
        ('android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png', 144),
        ('android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png', 144),
        ('android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png', 144),
        ('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', 192),
        ('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png', 192),
        ('android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png', 192),
    ]
    
    for filepath, size in icons:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        icon = create_icon(size)
        icon.save(filepath, 'PNG')
        print(f'Generated: {filepath} ({size}x{size})')
    
    print('\nAll icons generated successfully!')

if __name__ == '__main__':
    main()
