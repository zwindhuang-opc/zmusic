/**
 * faceDetection.js — High-accuracy face detection wrapper around @vladmandic/face-api.
 *
 * This module replaces the old YCbCr skin-color heuristic that caused false
 * two-person (couple) detection on single selfies. Face-API runs a real neural
 * network (SSD MobileNet v1 by default) in-browser via TFJS, so counts are
 * orders-of-magnitude more trustworthy.
 *
 * Flow:
 *   1. First call to `detectFaces()` lazy-loads + warms up nets (non-blocking
 *      UI, nets are cached for the lifetime of the module).
 *   2. On permanent failure (CSP, old browser, no WebGL / WASM backend…), we
 *      switch to `legacyHeuristicOnly = true` and the caller must fall back
 *      to the legacy cluster counting in visionAnalyzer.
 *   3. Results include: person count, dominant gender, age bucket, and the
 *      top 1-2 expressions — all used to flavor / pick the right lyrics style.
 *
 * Model weights are loaded from the local `/face-api-models/` folder (copied
 * from `node_modules/@vladmandic/face-api/model/` at build time) with a
 * fallback to the public jsDelivr CDN so demos work even if local copy is
 * missing.
 */

// Import via ESM. TFJS backend is chosen automatically by the library.
import * as faceapi from '@vladmandic/face-api';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Local path (preferred, bundled by Vite). Fallback to jsDelivr if 404.
const LOCAL_MODEL_PATH = '/face-api-models/';
const CDN_MODEL_PATH = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@2/model/';

// Accuracy vs speed: SSD Mobilenet v1 (~4MB weights) is much more accurate
// than TinyFaceDetector and still fast enough for a single static photo.
// The user paid a lot of attention to not hallucinate a second person, so
// accuracy wins here.
const USE_SSD_INSTEAD_OF_TINY = true;

// Minimum detection confidence for SSD. Higher = less false positives.
// 0.55 is quite conservative — we'd rather miss a tiny occluded face than
// hallucinate one.
const SSD_MIN_CONFIDENCE = 0.55;
const TINY_FACE_INPUT_SIZE = 224;
const TINY_FACE_SCORE = 0.5;

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let netsLoaded = false;
let netsPromise = null;
let legacyHeuristicOnly = false;
let lastLoadError = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function _tryLoadFromPath(basePath) {
    const jobs = [
        USE_SSD_INSTEAD_OF_TINY
            ? faceapi.nets.ssdMobilenetv1.load(basePath)
            : faceapi.nets.tinyFaceDetector.load(basePath),
        faceapi.nets.ageGenderNet.load(basePath),
        faceapi.nets.faceExpressionNet.load(basePath),
        faceapi.nets.faceLandmark68Net.load(basePath),
    ];
    await Promise.all(jobs);
}

async function _ensureNets() {
    if (netsLoaded) return true;
    if (legacyHeuristicOnly) return false;
    if (netsPromise) return netsPromise;

    netsPromise = (async () => {
        try {
            await _tryLoadFromPath(LOCAL_MODEL_PATH);
            netsLoaded = true;
            return true;
        } catch (localErr) {
            // Local path missing (most likely developer forgot to copy models) —
            // fall back to CDN so feature still works immediately.
            try {
                await _tryLoadFromPath(CDN_MODEL_PATH);
                netsLoaded = true;
                return true;
            } catch (cdnErr) {
                lastLoadError = `local=${localErr && localErr.message} | cdn=${cdnErr && cdnErr.message}`;
                legacyHeuristicOnly = true;
                return false;
            }
        }
    })();

    return netsPromise;
}

/**
 * Aggregate multi-face metadata into features that the lyrics engine
 * understands:
 *   - count: 0..n  (person count)
 *   - avgAge, ageBucket ('child' | 'teen' | 'young_adult' | 'adult' | 'senior')
 *   - dominantGender: 'male' | 'female' | 'mixed'
 *   - topExpression: 'happy' | 'neutral' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised'
 *   - isCoupleishLook: true when 2 faces roughly same age & close bounding boxes
 */
function _aggregateMeta(rawDetections) {
    const count = rawDetections.length;

    if (count === 0) {
        return { count: 0 };
    }

    const avgAge = rawDetections.reduce((s, r) => s + r.age, 0) / count;

    let ageBucket;
    if (avgAge < 13) ageBucket = 'child';
    else if (avgAge < 22) ageBucket = 'teen';
    else if (avgAge < 35) ageBucket = 'young_adult';
    else if (avgAge < 55) ageBucket = 'adult';
    else ageBucket = 'senior';

    // Gender — male/female/mixed (when 2+ faces of different genders)
    const genders = rawDetections.map(r => (r.gender || '').toLowerCase()).filter(Boolean);
    const hasMale = genders.includes('male');
    const hasFemale = genders.includes('female');
    let dominantGender;
    if (count === 1) dominantGender = genders[0] || 'unknown';
    else if (hasMale && hasFemale) dominantGender = 'mixed';
    else if (hasFemale) dominantGender = 'female';
    else if (hasMale) dominantGender = 'male';
    else dominantGender = 'unknown';

    // Top expression (aggregate across all faces, weighted by confidence)
    const expressionScores = {};
    for (const r of rawDetections) {
        if (!r.expressions) continue;
        for (const [k, v] of Object.entries(r.expressions)) {
            expressionScores[k] = (expressionScores[k] || 0) + v;
        }
    }
    let topExpression = 'neutral';
    let topScore = -1;
    for (const [k, v] of Object.entries(expressionScores)) {
        if (v > topScore) { topScore = v; topExpression = k; }
    }

    // Couple-ish look heuristic: 2 people, both close in age, boxes not far apart
    let isCoupleishLook = false;
    if (count === 2) {
        const [a, b] = rawDetections;
        const ageDiff = Math.abs(a.age - b.age);
        const boxA = a.detection.box;
        const boxB = b.detection.box;
        const cx1 = boxA.x + boxA.width / 2;
        const cy1 = boxA.y + boxA.height / 2;
        const cx2 = boxB.x + boxB.width / 2;
        const cy2 = boxB.y + boxB.height / 2;
        const dist = Math.hypot(cx1 - cx2, cy1 - cy2);
        const avgH = (boxA.height + boxB.height) / 2 || 1;
        const close = dist / avgH < 2.5; // centers within ~2.5 head-heights
        const sameGen = ageDiff < 15;
        isCoupleishLook = close && sameGen;
    }

    const avgConfidence = rawDetections.reduce((s, r) => s + r.detection.score, 0) / count;

    return {
        count,
        avgAge,
        ageBucket,
        dominantGender,
        topExpression,
        isCoupleishLook,
        avgConfidence,
        raw: rawDetections.map(r => ({
            age: r.age,
            gender: r.gender,
            expressions: r.expressions,
            score: r.detection.score,
            box: { x: r.detection.box.x, y: r.detection.box.y, w: r.detection.box.width, h: r.detection.box.height },
        })),
    };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect faces in an image source (HTMLImageElement, HTMLCanvasElement,
 * HTMLVideoElement, or a TF tensor) and return aggregated metadata.
 *
 * Returns a plain object with:
 *   - ok: true if the neural net was used (result is authoritative)
 *   - fallback: true when the nets could not be loaded (caller must use
 *               the legacy heuristic instead)
 *   - meta: { count, avgAge, ageBucket, dominantGender, topExpression,
 *            isCoupleishLook, avgConfidence, raw }
 *   - loadError: string with the last error (for debugging)
 */
export async function detectFaces(input, opts = {}) {
    if (!input) {
        return { ok: false, fallback: true, meta: { count: 0 }, loadError: 'no input' };
    }

    const ready = await _ensureNets();
    if (!ready) {
        return { ok: false, fallback: true, meta: { count: 0 }, loadError: lastLoadError };
    }

    try {
        const detectionOptions = USE_SSD_INSTEAD_OF_TINY
            ? new faceapi.SsdMobilenetv1Options({
                minConfidence: opts.minConfidence || SSD_MIN_CONFIDENCE,
                maxResults: 20,
            })
            : new faceapi.TinyFaceDetectorOptions({
                inputSize: TINY_FACE_INPUT_SIZE,
                scoreThreshold: TINY_FACE_SCORE,
            });

        const results = await faceapi
            .detectAllFaces(input, detectionOptions)
            .withFaceLandmarks()
            .withAgeAndGender()
            .withFaceExpressions();

        return {
            ok: true,
            fallback: false,
            meta: _aggregateMeta(results || []),
        };
    } catch (err) {
        // If inference itself blows up, signal the caller to fall back.
        return {
            ok: false,
            fallback: true,
            meta: { count: 0 },
            loadError: err && err.message,
        };
    }
}

/** Return true once the models are ready (for warm-up UIs). */
export async function isFaceDetectionReady() {
    return _ensureNets();
}

/** Low-level access to faceapi if needed elsewhere. */
export { faceapi };

export default { detectFaces, isFaceDetectionReady };
