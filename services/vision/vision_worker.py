#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
vision_worker.py — Python-side heavy vision analysis for zmusic.

This is the NON-JS complement to the browser-only heuristics. When the zmusic
Express backend is online, the browser will prefer this server-side analysis
because it can run a real YOLOv8n ONNX model via OpenCV's DNN engine to detect
80 COCO object classes (not only faces!). It also extracts simple color
histogram features from Pillow/numpy for indoor/outdoor / warm/cold hints.

Output (JSON on stdout):
{
  "objects": [ { "label": str, "conf": float, "bbox": [x,y,w,h] }, ... ],
  "counts":  { "person": N, "dog": N, ... },            // any non-zero class counts
  "sceneHints": [                                       // matches our JS SCENE_PROFILES
    { "id": "pet_friendship",       "score": 0.87 },
    { "id": "sports_action",        "score": 0.62 },
    ...
  ],
  "colorFeatures": {
    "avgBrightness": float, "warmRatio": float, "greenRatio": float, "blueRatio": float,
    "indoorOutdoor": "indoor" | "outdoor" | "unknown",
    "dominantHue": "warm" | "cool" | "neutral"
  },
  "meta": { "model": "yolov8n.onnx (OpenCV DNN)", "inferenceMs": float }
}

Exit codes: 0 success, 1 model missing, 2 corrupt image, 3 other error.
"""

from __future__ import annotations

import json
import os
import sys
import time
import base64
import hashlib
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# The 80 COCO class names used by YOLOv8n. DO NOT reorder.
COCO_CLASSES: tuple[str, ...] = (
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "knife" "knife",
    "knife kn-knife",  # placeholder - will fix below
    "spoon", "knife", "knknknife",
)

# Re-define cleanly to avoid the placeholder hack above:
COCO_CLASSES: tuple[str, ...] = (
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
    "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop",
    "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier",
    "toothbrush",
)

# Mapping: COCO label(s) + optional counts / color signal → JS SCENE_PROFILES id
# with a base score.  Multiple hits stack (score is clamped).
# These scores feed directly into classifyScene() on the JS side when the server
# response is merged in — they add a strong bias to the right profile without
# removing the color fallbacks.
_SCENE_RULES: list[tuple[set[str], str, float]] = [
    # Animals / pets
    ({"cat", "dog", "bird", "horse"}, "pet_friendship", 0.9),
    ({"elephant", "bear", "zebra", "giraffe", "sheep", "cow"}, "wild_nature_adventure", 0.85),
    # Food
    ({"pizza", "hot dog", "donut", "cake", "sandwich", "banana", "apple", "orange",
      "broccoli", "carrot", "bowl", "fork", "knife", "spoon", "cup", "wine glass",
      "bottle"}, "culinary_memory", 0.8),
    # Celebration: big group + cake = 100% festive
    ({"cake", "dining table", "person>=3"}, "festive_celebration", 0.95),
    # Sports
    ({"surfboard"}, "seaside_vacation", 0.95),
    ({"snowboard", "skis"}, "sports_action", 0.92),
    ({"tennis racket", "baseball bat", "baseball glove", "sports ball", "frisbee",
      "skateboard", "kite"}, "sports_action", 0.88),
    # Indoor home
    ({"couch", "bed", "potted plant", "tv", "microwave", "oven", "toaster", "sink",
      "refrigerator"}, "cozy_home_indoor", 0.82),
    ({"book", "chair", "couch"}, "cozy_reading", 0.8),
    # Work / office
    ({"laptop", "mouse", "keyboard", "cell phone", "remote", "desk"},
     "workspace_office", 0.85),
    # Travel / transport
    ({"airplane", "suitcase", "backpack"}, "travel_adventure", 0.9),
    ({"car", "truck", "bus", "motorcycle"}, "road_trip", 0.8),
    ({"train", "boat"}, "journey_commute", 0.78),
    # Urban
    ({"traffic light", "stop sign", "parking meter", "fire hydrant", "bench",
      "bicycle"}, "city_street", 0.78),
    # Outdoor nature (indirect: bench + many persons → park; but we rely on colorFeatures too)
    ({"dining table", "umbrella", "person>=2"}, "picnic_outdoor", 0.8),
    # Romantic hints: 2 people + wine glass / dining table
    ({"person=2", "wine glass", "dining table"}, "romantic_dinner", 0.9),
    ({"person=2", "couch"}, "couple_couch_movie_night", 0.75),
    # Family: 3+ persons + (dining table / couch / bed)
    ({"person>=3", "dining table"}, "family_gathering", 0.88),
    ({"person>=3", "couch"}, "family_gathering", 0.82),
    # Stage hints are NOT in COCO (no guitar / mic / stage). CLIP would catch them.
]

# Official Ultralytics YOLOv8n ONNX — tiny 6MB, COCO pretrained, auto-downloaded
# (we don't commit it to git; worker downloads it once into ./models/).
# Multiple fallbacks because GitHub releases & tags move.
_ONNX_URLS: tuple[str, ...] = (
    "https://huggingface.co/Ultralytics/YOLOv8n/resolve/main/yolov8n.onnx",
    "https://github.com/ultralytics/assets/releases/download/v8.4.0/yolov8n.onnx",
    "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx",
)
_MODEL_DIR = Path(__file__).resolve().parent / "models"
_MODEL_PATH = _MODEL_DIR / "yolov8n.onnx"
_NO_DOWNLOAD = False  # flipped by --no-download CLI flag
_OUTPUT_FILE: str | None = None  # set via --output PATH; default = stdout


# ---------------------------------------------------------------------------
# CLI arg parsing (small custom impl — we deliberately keep stdlib-only)
# ---------------------------------------------------------------------------

def _parse_args() -> None:
    """Walk sys.argv once; fill globals _NO_DOWNLOAD / _OUTPUT_FILE.
    Also returns the input path string if the user passed one via position
    or --input.  Caller still uses stdin fallback if nothing is found."""
    global _NO_DOWNLOAD, _OUTPUT_FILE
    i = 1
    n = len(sys.argv)
    while i < n:
        a = sys.argv[i]
        if a in ("-h", "--help"):
            print(__doc__)
            print("Usage: vision_worker.py [INPUT_PATH|-] [OUTPUT_PATH] [--no-download] [--input P] [--output P]")
            sys.exit(0)
        if a == "--no-download":
            _NO_DOWNLOAD = True
            i += 1
            continue
        if a == "--output":
            _OUTPUT_FILE = sys.argv[i + 1] if i + 1 < n else None
            i += 2
            continue
        if a == "--input":
            i += 2
            continue
        if a.startswith("--"):
            i += 1
            continue
        i += 1


_parse_args()


# ---------------------------------------------------------------------------
# Model download (zero-git-weight, cached)
# ---------------------------------------------------------------------------

def _ensure_model() -> Path:
    """Download YOLOv8n ONNX if missing. Returns local path."""
    if _MODEL_PATH.exists() and _MODEL_PATH.stat().st_size > 5_000_000:
        return _MODEL_PATH
    if _NO_DOWNLOAD:
        raise FileNotFoundError(
            f"yolov8n.onnx not found at {_MODEL_PATH} and --no-download was set. "
            f"Run without --no-download to auto-download, or place a valid ONNX file there."
        )
    _MODEL_DIR.mkdir(parents=True, exist_ok=True)
    import requests
    last_err: Exception | None = None
    tmp_path = _MODEL_PATH.with_suffix(".onnx.dl")
    for url in _ONNX_URLS:
        try:
            with requests.get(url, stream=True, timeout=120) as r:
                r.raise_for_status()
                with open(tmp_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=1 << 16):
                        if chunk:
                            f.write(chunk)
            if not tmp_path.exists() or tmp_path.stat().st_size < 5_000_000:
                raise RuntimeError(f"downloaded file too small: {tmp_path.stat().st_size}")
            tmp_path.replace(_MODEL_PATH)
            return _MODEL_PATH
        except Exception as e:
            last_err = e
            try:
                if tmp_path.exists():
                    tmp_path.unlink()
            except Exception:
                pass
            continue
    raise RuntimeError("failed to download yolov8n.onnx from all URLs", last_err)


# ---------------------------------------------------------------------------
# YOLOv8 ONNX inference via cv2.dnn (no torch / ultralytics required)
# ---------------------------------------------------------------------------

def _load_net():
    """Return a cv2.dnn.Net loaded with YOLOv8n ONNX."""
    import cv2  # local import so import errors surface clearly
    model_path = _ensure_model()
    net = cv2.dnn.readNetFromONNX(str(model_path))
    # Prefer CUDA if the user has a dnn-enabled build, else CPU.
    try:
        net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
        net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
    except Exception:
        pass
    return net


def _letterbox(im: np.ndarray, new_shape=(640, 640), color=(114, 114, 114)) -> tuple[np.ndarray, tuple[float, float], tuple[float, float]]:
    """Resize + pad image to exact new_shape keeping aspect ratio."""
    import cv2
    shape = im.shape[:2]  # H, W
    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
    new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
    dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]
    dw /= 2
    dh /= 2
    if shape[::-1] != new_unpad:
        im = cv2.resize(im, new_unpad, interpolation=cv2.INTER_LINEAR)
    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    im = cv2.copyMakeBorder(im, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
    return im, (r, r), (dw, dh)


def _scale_boxes(detections: list, img1_shape, img0_shape, ratio_pad=None) -> list:
    """Rescale boxes (xywh) from img1_shape (letterboxed) back to img0_shape."""
    if ratio_pad is None:
        gain = min(img1_shape[0] / img0_shape[0], img1_shape[1] / img0_shape[1])
        pad = ((img1_shape[1] - img0_shape[1] * gain) / 2,
               (img1_shape[0] - img0_shape[0] * gain) / 2)
    else:
        gain = ratio_pad[0][0]
        pad = ratio_pad[1]

    out = []
    for det in detections:  # det: [x, y, w, h, conf, cls_idx]
        x, y, w, h = det[0], det[1], det[2], det[3]
        x0 = (x - w / 2 - pad[0]) / gain
        y0 = (y - h / 2 - pad[1]) / gain
        w0 = w / gain
        h0 = h / gain
        out.append([float(x0), float(y0), float(w0), float(h0), det[4], int(det[5])])
    return out


def detect_objects(pil_img: Image.Image, conf_thr: float = 0.35, iou_thr: float = 0.5) -> list[dict[str, Any]]:
    """Run YOLOv8n on the PIL image, return list of dicts: {label, conf, bbox}."""
    import cv2
    net = _load_net()
    im_bgr = np.array(pil_img.convert("RGB"))[:, :, ::-1].copy()  # RGB→BGR for cv2
    im0_h, im0_w = im_bgr.shape[:2]

    letterboxed, ratio, pad = _letterbox(im_bgr, (640, 640))
    blob = cv2.dnn.blobFromImage(letterboxed, 1.0 / 255.0, (640, 640),
                                  swapRB=False, crop=False)
    net.setInput(blob)
    preds = net.forward()  # shape: (1, 84, 8400) for YOLOv8n

    # YOLOv8 output layout: 4 (cx,cy,w,h) + 80 (class scores) = 84 rows, 8400 cols
    preds = preds[0].T  # → (8400, 84)
    boxes_xywh = preds[:, :4]
    scores_cls = preds[:, 4:]
    class_ids = np.argmax(scores_cls, axis=1)
    confs = scores_cls[np.arange(len(scores_cls)), class_ids]
    mask = confs >= conf_thr

    boxes_cv2 = []  # x, y, w, h (top-left based — OpenCV NMS wants this format)
    kept_conf = []
    kept_cls = []
    for i, keep in enumerate(mask):
        if not keep:
            continue
        cx, cy, w, h = boxes_xywh[i]
        boxes_cv2.append([float(cx - w / 2), float(cy - h / 2), float(w), float(h)])
        kept_conf.append(float(confs[i]))
        kept_cls.append(int(class_ids[i]))

    if not boxes_cv2:
        return []

    indices = cv2.dnn.NMSBoxes(boxes_cv2, kept_conf, conf_thr, iou_thr)
    if hasattr(indices, "flatten"):
        indices = indices.flatten()

    # Rescale boxes back to letterboxed img coords (they're in 640x640 top-left format)
    nms_dets = []
    for i in indices:
        x, y, w, h = boxes_cv2[i]
        cx = x + w / 2
        cy = y + h / 2
        nms_dets.append([cx, cy, w, h, kept_conf[i], kept_cls[i]])
    scaled = _scale_boxes(nms_dets, (640, 640), (im0_h, im0_w), (ratio, pad))

    out: list[dict[str, Any]] = []
    for x0, y0, w0, h0, conf, cls_idx in scaled:
        try:
            label = COCO_CLASSES[int(cls_idx)]
        except IndexError:
            label = f"cls_{int(cls_idx)}"
        out.append({
            "label": label,
            "conf": round(float(conf), 4),
            "bbox": [round(x0, 1), round(y0, 1), round(w0, 1), round(h0, 1)],
        })
    return out


# ---------------------------------------------------------------------------
# Color features (indoor/outdoor, warm/cold) — no ML, just histograms.
# ---------------------------------------------------------------------------

def extract_color_features(pil_img: Image.Image) -> dict[str, Any]:
    arr = np.array(pil_img.convert("RGB")).reshape(-1, 3).astype(np.float32) / 255.0
    r, g, b = arr[:, 0], arr[:, 1], arr[:, 2]
    brightness = float(np.mean(0.299 * r + 0.587 * g + 0.114 * b))
    warm = float(np.mean((r - b) > 0.15))
    cool = float(np.mean((b - r) > 0.15))
    green = float(np.mean((g - 0.5 * (r + b)) > 0.08))
    blue_dom = float(np.mean((b > 0.55) & (b > r + 0.05) & (b > g + 0.05)))

    indoor_evidence = max(0.0, warm - 0.15) - max(0.0, green - 0.25) - max(0.0, blue_dom - 0.15)
    outdoor_evidence = green * 0.8 + blue_dom * 0.7 - (1.0 - brightness) * 0.2
    if outdoor_evidence - indoor_evidence > 0.08:
        io = "outdoor"
    elif indoor_evidence - outdoor_evidence > 0.05:
        io = "indoor"
    else:
        io = "unknown"

    if warm > cool + 0.08:
        hue = "warm"
    elif cool > warm + 0.08:
        hue = "cool"
    else:
        hue = "neutral"

    return {
        "avgBrightness": round(brightness, 4),
        "warmRatio": round(warm, 4),
        "greenRatio": round(green, 4),
        "blueRatio": round(blue_dom, 4),
        "indoorOutdoor": io,
        "dominantHue": hue,
    }


# ---------------------------------------------------------------------------
# Scene profile hints from detected objects
# ---------------------------------------------------------------------------

def compute_scene_hints(objects: list[dict[str, Any]], color_feats: dict[str, Any]) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for o in objects:
        counts[o["label"]] = counts.get(o["label"], 0) + 1
    person_count = counts.get("person", 0)

    label_set = set(counts.keys())
    scores: dict[str, float] = {}
    for need_labels, scene_id, base in _SCENE_RULES:
        hit = True
        score = base
        for need in need_labels:
            # Person-count predicates like "person>=3" or "person=2"
            if need.startswith("person"):
                op = need[len("person"):]
                ok = False
                if op.startswith(">="):
                    ok = person_count >= int(op[2:])
                elif op.startswith("<="):
                    ok = person_count <= int(op[2:])
                elif op.startswith("="):
                    ok = person_count == int(op[1:])
                elif op.startswith(">"):
                    ok = person_count > int(op[1:])
                elif op.startswith("<"):
                    ok = person_count < int(op[1:])
                if not ok:
                    hit = False
                    break
            elif need not in label_set:
                hit = False
                break
        if hit:
            scores[scene_id] = min(1.0, scores.get(scene_id, 0.0) + score)

    # Color-based boosters: "outdoor + high green" biases to nature scenes
    if color_feats.get("indoorOutdoor") == "outdoor":
        if color_feats.get("greenRatio", 0) > 0.25:
            scores["nature_healing"] = min(1.0, scores.get("nature_healing", 0) + 0.75)
        if color_feats.get("blueRatio", 0) > 0.3:
            scores["seaside_vacation"] = min(1.0, scores.get("seaside_vacation", 0) + 0.7)
    if color_feats.get("dominantHue") == "warm" and counts.get("cake", 0) and person_count >= 2:
        scores["festive_celebration"] = min(1.0, scores.get("festive_celebration", 0) + 0.25)
    if person_count >= 3 and "dining table" in label_set:
        scores["festive_celebration"] = min(1.0, scores.get("festive_celebration", 0) + 0.35)

    hints = sorted(({"id": sid, "score": round(s, 3)} for sid, s in scores.items()),
                   key=lambda x: -x["score"])
    return hints


# ---------------------------------------------------------------------------
# Input: path (argv[1]) OR base64 JPEG/PNG on stdin (data URL or raw)
# ---------------------------------------------------------------------------

def _read_input() -> Image.Image:
    if len(sys.argv) >= 2 and os.path.exists(sys.argv[1]):
        return Image.open(sys.argv[1]).convert("RGB")
    raw = sys.stdin.buffer.read()
    if not raw:
        raise ValueError("No image: pass path as argv[1] or base64/bytes on stdin")
    # Strip data URL prefix if present
    text = raw.decode("utf-8", errors="ignore").strip()
    if text.startswith("data:"):
        text = text.split(",", 1)[1]
    try:
        data = base64.b64decode(text, validate=False)
    except Exception:
        data = raw
    return Image.open(BytesIO(data)).convert("RGB")


def main() -> int:
    def _emit(payload: dict) -> None:
        text = json.dumps(payload, ensure_ascii=False)
        if _OUTPUT_FILE:
            try:
                Path(_OUTPUT_FILE).parent.mkdir(parents=True, exist_ok=True)
                Path(_OUTPUT_FILE).write_text(text, encoding="utf-8")
            except Exception:
                pass
        sys.stdout.write(text)
        sys.stdout.flush()

    try:
        img = _read_input()
    except Exception as e:
        _emit({"error": f"bad image input: {e}"})
        return 2

    # --- Object detection ------------------------------------------------
    t0 = time.perf_counter()
    model_warning: str | None = None
    try:
        objects = detect_objects(img)
    except FileNotFoundError as e:
        # Model missing / --no-download.  Degrade gracefully: return empty
        # objects list so color features & scene hints still flow upstream,
        # tagged with a clear note.
        objects = []
        model_warning = str(e)
    except Exception as e:
        _emit({"error": f"inference failed: {e}"})
        return 3
    dt_ms = round((time.perf_counter() - t0) * 1000, 1)

    counts: dict[str, int] = {}
    for o in objects:
        counts[o["label"]] = counts.get(o["label"], 0) + 1

    color_feats = extract_color_features(img)
    hints = compute_scene_hints(objects, color_feats)

    result = {
        "objects": objects,
        "counts": counts,
        "sceneHints": hints,
        "colorFeatures": color_feats,
        "meta": {
            "model": "yolov8n.onnx (OpenCV DNN)",
            "inferenceMs": dt_ms,
            "size": {"w": img.width, "h": img.height},
            **({"warning": model_warning} if model_warning else {}),
        },
    }

    _emit(result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
