# -*- coding: utf-8 -*-
"""ZMusic v6.6.6 全系统截图脚本
目的：对每个主要页面进行全屏截图，保存到 screenshots/v6.6.6/
运行环境：已安装 Python 3
"""
import os
import sys

# 尝试使用 mss + PIL
try:
    import mss
    from PIL import Image
except ImportError:
    print("需要安装依赖: pip install mss pillow")
    sys.exit(1)

screenshots_dir = r"e:\AI_Projects\zmusic\screenshots\v6.6.6"
os.makedirs(screenshots_dir, exist_ok=True)

pages = {
    "01_dashboard": "http://localhost:4201/",
    "02_muse_ai": "http://localhost:4201/muse",
    "03_suno_ai": "http://localhost:4201/suno",
    "04_melo_ai": "http://localhost:4201/melo",
    "05_lyrics": "http://localhost:4201/lyrics",
    "06_image_lyrics": "http://localhost:4201/image-lyrics",
    "07_mv": "http://localhost:4201/mv",
    "08_settings": "http://localhost:4201/settings",
    "09_generations": "http://localhost:4201/generations",
}

print(f"截图目录：{screenshots_dir}")
print("需要您使用浏览器手动访问每个 URL，然后在这里按回车保存截图。")
print("建议使用 Chrome / Edge 全屏访问，确保页面加载完成后再截图。")
print()

for name, url in pages.items():
    print(f"==== {name} ====")
    print(f"URL: {url}")
    try:
        input("  → 打开该页面并等待渲染完成后，按回车键截图...")
    except EOFError:
        pass

    with mss.mss() as sct:
        # 截取整个屏幕主显示器
        screenshot = sct.grab(sct.monitors[0])
        img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
        file_path = os.path.join(screenshots_dir, f"{name}.png")
        img.save(file_path)
        print(f"  ✓ 已保存：{file_path} ({img.size})")

print()
print("全部截图已完成！")
print(f"目录：{screenshots_dir}")
