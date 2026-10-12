# TXT PICKER / PROTOCOL 0.1

`human-picker-server` owns the decision. `txt-picker` renders it.

## Scope

V0.1 only supports single text decisions with 2–9 candidate strings. All server-side persistence, user authentication, events and MCP tools belong to `human-picker-server`.

## Trust and ownership

- Producers (AI Agents, scripts, MCP clients) create decision requests.
- Humans own selection and confirmation.
- The renderer **never** silently selects an option or bypasses confirmation.
- Cancellation and expiry are distinct from confirmation.
- An edited text must be checked for non-emptiness and maximum 4,000 characters. Server validation remains authoritative.
- Server access tokens must not be built into bundled renderer code or stored in the package.
- A `confirmed` response does **not** authorize unrelated operations such as `git push`, `git rebase` or deleting data.

## Shared V0.1 wire schema

```json
{
  "type": "text",
  "title": "Choose a commit message",
  "source": "pi-agent",
  "context": { "project": "Personal OS", "summary": "Storage layer changes" },
  "options": [
    { "id": "a", "text": "feat(storage): [DATA VAULT ONLINE] Data vault enabled" },
    { "id": "b", "text": "feat(storage): [STORAGE READY] Added SQLite persistence" }
  ]
}
```

Confirmation sends:

```json
{ "option_id": "a" }
```

Edited confirmation sends:

```json
{ "option_id": "a", "text": "feat(storage): [DATA VAULT ONLINE] Local persistence ready" }
```

The server responds with a persisted `Decision` including `status` and `selection`.

## Routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/v1/decisions` | Create a text decision |
| GET | `/api/v1/decisions` | List decisions |
| GET | `/api/v1/decisions/:id` | Read a decision |
| GET | `/api/v1/decisions/:id/wait?timeout_ms=15000` | Wait up to 25 seconds |
| POST | `/api/v1/decisions/:id/resolve` | Confirm selected text |
| POST | `/api/v1/decisions/:id/cancel` | Cancel request |

All except health require a Bearer token. The server also exposes `human_picker_create`, `human_picker_get_result`, `human_picker_wait_result` via `/mcp`.

## Integration contract

```text
create -> pending
pending -> confirmed OR cancelled OR expired
confirmed/cancelled/expired -> terminal (immutable)
```

An Agent can poll for `confirmed`, or listen through a compatible adapter. The browser by itself cannot force an arbitrary LLM conversation to resume. When no live adapter exists, copy/paste is the correct fallback.

## Future batch mode

Batch text review should be implemented without rewriting any Git history automatically. For a multi-commit picker, keep each original SHA stable and present the final list for an explicit, second approval before the Agent performs any history mutations.
