"""
Image forensics service — detects manipulation, AI generation, and metadata anomalies.
Techniques: ELA, noise analysis, EXIF forensics, copy-move detection, AI detection.
"""
import io
import math
from typing import Optional

import cv2
import numpy as np
import piexif
from PIL import Image, ImageChops, ImageEnhance

# Lazy-load the AI detector to avoid slow startup
_ai_detector = None

def _get_ai_detector():
    global _ai_detector
    if _ai_detector is None:
        try:
            from transformers import pipeline
            _ai_detector = pipeline(
                "image-classification",
                model="umm-maybe/AI-image-detector",
            )
        except Exception:
            _ai_detector = False  # mark as unavailable
    return _ai_detector if _ai_detector is not False else None


def _ela_score(img_bytes: bytes, quality: int = 90) -> float:
    """
    Error Level Analysis: re-save at lower quality, compute pixel difference.
    Higher score = more compression artifacts = possible manipulation.
    Returns a score 0.0–1.0.
    """
    try:
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=quality)
        buf.seek(0)
        recompressed = Image.open(buf).convert("RGB")

        diff = ImageChops.difference(img, recompressed)
        arr  = np.array(diff).astype(np.float32)
        # Amplify small differences
        enhanced = np.clip(arr * 10, 0, 255)
        mean_ela = float(enhanced.mean())
        # Normalise to 0–1 (empirically, >30 is suspicious)
        return round(min(1.0, mean_ela / 50.0), 4)
    except Exception:
        return 0.0


def _noise_inconsistency_score(img_bytes: bytes) -> float:
    """
    Computes local noise variance across image tiles.
    Large variance in noise levels across tiles indicates splicing.
    Returns 0.0–1.0.
    """
    try:
        img = Image.open(io.BytesIO(img_bytes)).convert("L")
        arr = np.array(img).astype(np.float32)

        h, w = arr.shape
        tile_h, tile_w = max(1, h // 8), max(1, w // 8)
        variances = []

        for i in range(0, h - tile_h + 1, tile_h):
            for j in range(0, w - tile_w + 1, tile_w):
                tile = arr[i:i+tile_h, j:j+tile_w]
                variances.append(float(tile.var()))

        if len(variances) < 4:
            return 0.0

        var_of_var = float(np.var(variances))
        # Normalise: high var_of_var means inconsistent noise
        return round(min(1.0, math.log1p(var_of_var) / 15.0), 4)
    except Exception:
        return 0.0


def _exif_forensics(img_bytes: bytes) -> dict:
    """
    Check EXIF metadata for signs of editing or stripping.
    Returns dict with flags.
    """
    result = {
        "metadata_stripped": False,
        "software_edited":   False,
        "creation_software": None,
        "gps_present":       False,
    }
    try:
        exif_data = piexif.load(img_bytes)
        if not exif_data or all(len(v) == 0 for v in exif_data.values()):
            result["metadata_stripped"] = True
            return result

        zeroth = exif_data.get("0th", {})
        software = zeroth.get(piexif.ImageIFD.Software, b"")
        if isinstance(software, bytes):
            software = software.decode("utf-8", errors="ignore").strip()
        if software:
            result["creation_software"] = software
            edit_keywords = ["photoshop", "gimp", "affinity", "lightroom", "capture one",
                             "canva", "snapseed", "adobe", "illustrator"]
            if any(k in software.lower() for k in edit_keywords):
                result["software_edited"] = True

        gps = exif_data.get("GPS", {})
        result["gps_present"] = len(gps) > 0

    except Exception:
        result["metadata_stripped"] = True

    return result


def _copy_move_score(img_bytes: bytes) -> float:
    """
    Simplified copy-move detection using ORB keypoint matching.
    High number of very close matches within the same image suggests duplication.
    Returns 0.0–1.0.
    """
    try:
        img_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(img_arr, cv2.IMREAD_GRAYSCALE)
        if img is None:
            return 0.0

        orb = cv2.ORB_create(nfeatures=500)
        kp, des = orb.detectAndCompute(img, None)
        if des is None or len(kp) < 20:
            return 0.0

        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        matches = bf.knnMatch(des, des, k=2)

        suspicious = 0
        for m_list in matches:
            if len(m_list) < 2:
                continue
            m, n = m_list[0], m_list[1]
            if m.queryIdx == m.trainIdx:
                continue
            if m.distance < 0.7 * n.distance:
                # Check spatial proximity — copy-move will be spatially close
                p1 = kp[m.queryIdx].pt
                p2 = kp[m.trainIdx].pt
                dist = math.hypot(p1[0] - p2[0], p1[1] - p2[1])
                if dist < 50:  # very close = suspicious copy
                    suspicious += 1

        ratio = suspicious / max(len(kp), 1)
        return round(min(1.0, ratio * 5), 4)
    except Exception:
        return 0.0


def _ai_artifact_score(img_bytes: bytes) -> float:
    """
    Uses a HuggingFace classifier to detect AI-generated image artifacts.
    Returns 0.0–1.0 probability of being AI-generated.
    """
    detector = _get_ai_detector()
    if detector is None:
        return 0.0
    try:
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        results = detector(img)
        for r in results:
            label = (r.get("label") or "").lower()
            if "artificial" in label or "ai" in label or "fake" in label or "generated" in label:
                return round(float(r.get("score", 0.0)), 4)
        return 0.0
    except Exception:
        return 0.0


def analyze_image(img_bytes: bytes) -> dict:
    """
    Full forensics analysis pipeline.
    Returns verdict + signals dict.
    """
    ela          = _ela_score(img_bytes)
    noise        = _noise_inconsistency_score(img_bytes)
    exif         = _exif_forensics(img_bytes)
    copy_move    = _copy_move_score(img_bytes)
    ai_artifact  = _ai_artifact_score(img_bytes)

    signals = {
        "ela_score":            ela,
        "noise_inconsistency":  noise,
        "metadata_stripped":    exif["metadata_stripped"],
        "software_edited":      exif["software_edited"],
        "creation_software":    exif["creation_software"],
        "copy_move_detected":   copy_move > 0.30,
        "copy_move_score":      copy_move,
        "ai_artifact_score":    ai_artifact,
        "gps_present":          exif["gps_present"],
    }

    # ── Verdict logic ───────────────────────────────────────────────────────
    if ai_artifact >= 0.75:
        verdict    = "ai_generated"
        confidence = round(ai_artifact, 4)
    elif ela >= 0.65 or copy_move >= 0.45 or exif["software_edited"]:
        manipulated_score = max(ela, copy_move, 0.60 if exif["software_edited"] else 0.0)
        verdict    = "manipulated"
        confidence = round(min(0.95, manipulated_score * 1.15), 4)
    elif ela >= 0.40 or noise >= 0.50 or ai_artifact >= 0.40:
        # Suspicious but not definitive
        composite  = (ela * 0.4 + noise * 0.3 + ai_artifact * 0.3)
        verdict    = "manipulated"
        confidence = round(min(0.75, composite), 4)
    elif ela < 0.20 and noise < 0.30 and not exif["software_edited"] and ai_artifact < 0.20:
        verdict    = "authentic"
        confidence = round(min(0.90, 1.0 - max(ela, noise, ai_artifact)), 4)
    else:
        verdict    = "inconclusive"
        confidence = 0.50

    return {
        "image_verdict": verdict,
        "confidence":    confidence,
        "signals":       signals,
    }
