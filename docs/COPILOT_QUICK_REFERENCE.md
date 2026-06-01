# Copilot Quick Reference (JachaiX)

## Keyboard Shortcuts (common defaults)
> Exact keys vary by IDE/keymap.

- Open Copilot Chat: `Ctrl/Cmd + Shift + I`
- Trigger inline suggestion: `Alt+\\` or editor-specific trigger
- Accept suggestion: `Tab`
- Next/previous suggestion: `Alt+]` / `Alt+[` (or IDE equivalent)

## High-Value Prompts for JachaiX
- "Create pytest cases for Bangla misinformation detection edge cases."
- "Refactor this Laravel service for clearer retry/error handling."
- "Generate TypeScript UI state model for fact-check result lifecycle."
- "Summarize risks in this PR (privacy, trust-score bias, evidence leakage)."

## IDE Settings
- Enable inline completions.
- Keep automatic code review enabled for PRs.
- Use project instruction file: `.github/copilot-instructions.md`.

## GitHub Mobile Tips
- Use mobile chat for quick PR/issue clarifications.
- Ask for concise summaries before approving or requesting changes.

## Troubleshooting
- **Irrelevant suggestions:** add repo-specific context and constraints.
- **Overconfident output:** ask for uncertainty + alternatives.
- **Bangla quality issues:** require Bangla examples and edge-case tests.
- **Security concerns:** ask Copilot to highlight attack surface + input validation.
