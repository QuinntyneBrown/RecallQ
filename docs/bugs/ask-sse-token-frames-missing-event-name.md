# Ask SSE token frames missing `event: token` name

**Flow:** 19 — Ask Mode (Streaming Answer)
**Severity:** Low (wire-format gap)
**Status:** Open

## Symptom

Flow 19 step 8:

> As tokens arrive, the endpoint emits `event: token\ndata: "..."`
> SSE frames to the client.

`backend/RecallQ.Api/Endpoints/AskEndpoints.cs`:

```csharp
await foreach (var token in client.StreamAsync(messages, http.RequestAborted))
{
    answer.Append(token);
    var json = JsonSerializer.Serialize(new { token });
    await http.Response.WriteAsync($"data: {json}\n\n", http.RequestAborted);
    await http.Response.Body.FlushAsync(http.RequestAborted);
}
```

Each frame is `data: {...}\n\n` with no `event:` line, so the
default SSE event name `message` is used. The SPA's parser tolerates
this because its fallback branch reads `parsed.token`, but external
clients (browser `EventSource` listeners filtering by event name,
mocked test SSE servers, generic SSE-debug tooling) miss the
intended semantic.

The other named events (`citations`, `followups`, `error`, `done`)
do carry `event:` lines. Token frames are the odd one out.

## Expected

Each token frame is:

```
event: token
data: {"token":"..."}

```

## Actual

```
data: {"token":"..."}

```

## Repro

1. POST `/api/ask` with any question.
2. `curl -N` (or any SSE consumer) the response and watch the raw
   stream.
3. Token frames have no `event:` line; the named events appear
   only for `citations`, `followups`, and `done`.

## Notes

Radically simple fix: prepend `event: token\n` to the data write:

```csharp
await http.Response.WriteAsync($"event: token\ndata: {json}\n\n", http.RequestAborted);
```

The SPA's existing parser already falls through to the same
token-handling branch for any non-special event name; adding the
explicit name doesn't break the SPA but does match the flow's wire
contract.
