# Development rules for txt-picker

- This repository owns only the text decision renderer and its optional REST client, not another MCP server or decision database.
- Keep Vue component emits deterministic and avoid automatic destructive actions.
- Preserve server V0.1 JSON wire compatibility until a versioned migration is intentionally introduced.
- Cancelled/expired decisions never imply confirmation.
- Do not commit tokens, personal project data or secrets.
- Use precise Conventional Commit subjects, with optional concise human-picker system event tags.
- Verify `npm test`, `npm run typecheck`, `npm run build` when dependencies are available; report failures honestly.
