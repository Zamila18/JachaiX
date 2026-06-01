# Copilot Best Practices for JachaiX

## 1) Fact-Checking Platform Development

### Prompting for trust-score algorithms
- Specify input signals (source reliability, evidence match, uncertainty).
- Ask for interpretable outputs (`score`, `reason`, `evidence_used`).
- Require deterministic behavior where possible.

**Example prompt:**
> "Implement a trust-score calculator with weighted signals and an explain() method; include edge-case tests."

### Generating misinformation test cases
- Ask for balanced true/false/misleading examples.
- Include Bangladesh-context claims and multilingual variants.
- Request adversarial examples (sarcasm, cropped screenshots, paraphrases).

### Optimizing Bangla text processing
- Ask Copilot to preserve Unicode correctness.
- Include normalization/tokenization assumptions in prompts.
- Always request tests for mixed Bangla-English inputs.

### Handling multimodal content
- Ask for modality-specific validators (text/image/video).
- Add fallback logic for OCR failures and low-confidence extractions.
- Keep evidence provenance attached across pipeline steps.

### Privacy considerations
- Never include raw sensitive personal data in prompts.
- Prefer synthetic or masked samples.
- Ask Copilot to include privacy-safe logging patterns.

---

## 2) Code Quality Practices
- Use Copilot Code Review on every PR.
- Configure automatic PR reviews for faster feedback.
- Keep commit messages concise and scoped (`feat`, `fix`, `docs`, `test`).
- Use Copilot to generate docs/comments for complex logic only.

---

## 3) Team Collaboration
- Use Copilot Spaces for shared prompts and implementation playbooks.
- Store stable project conventions in Copilot Memory.
- Run periodic review of saved memories for drift/outdated assumptions.
