# JachaiX Judge Pack

## 1) Problem
Bangla misinformation spreads rapidly through text posts and screenshots. Verification is slow and often lacks clear evidence links.

## 2) Solution
JachaiX is a Bangla-first trust platform that accepts text and images, extracts factual claims, retrieves evidence from a trusted Bangla corpus, and returns an explainable trust report with score, verdict, and citations.

## 3) AI Depth
- OCR layer for screenshot text extraction.
- Claim extraction to normalize noisy input into verifiable claims.
- Vector retrieval on Qdrant using multilingual/Bangla-capable embeddings.
- Optional reranking for stronger evidence precision.
- Trust scoring with uncertainty-aware human review flag.
- End-to-end benchmark scoring with accuracy, precision, recall, and macro F1.

## 4) Why Bangladesh
- Bangla-first processing, not English-only assumptions.
- Local misinformation patterns include screenshot claims and quote manipulation.
- Evidence-backed outputs improve public trust and journalistic verification speed.

## 5) Demo Story (60-90 sec)
1. Submit Bangla text claim.
2. Show verdict + score + evidence links.
3. Submit screenshot claim.
4. Show OCR text extraction and final report.
5. Show evaluation metrics file and mention macro F1 focus.

## 6) Selection-Focused Claims
- Practical architecture with Laravel + MySQL + Docker for fast implementation.
- Real retrieval depth with Qdrant, chunking, embeddings, and reranker.
- Explainable output with citations, not a black-box answer.
- Built to ship in 8 days with measurable quality gates.

## 7) Metrics Section Template
- Samples: <N>
- Accuracy: <value>
- Macro Precision: <value>
- Macro Recall: <value>
- Macro F1: <value>
- Key failure buckets: OCR noise, low-evidence claims, ambiguous phrasing.

## 8) Final Elevator Pitch
JachaiX turns Bangla text or screenshots into explainable trust decisions with verifiable evidence, helping Bangladesh fight misinformation with practical AI that teams can actually deploy.
