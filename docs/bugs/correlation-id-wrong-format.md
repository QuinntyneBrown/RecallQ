# Correlation ID header returns UUID in wrong format

**Status:** Complete
**Source:** Flow 37 - Observability Correlation ID E2E tests
**Severity:** Medium (header value is valid but not in standard GUID format)

## Symptom

The `X-Correlation-Id` response header returns a UUID in "N" format (32 hex digits without hyphens) instead of the standard GUID format (with hyphens).

Example:
- Actual: `8168070162154f44ab0c83f4c585c1af`
- Expected: `81680701-6215-4f44-ab0c-83f4c585c1af`

## Expected

Per flow 37 specification, the correlation ID should be a GUID. The standard GUID format includes hyphens and is more readable: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## Actual

`backend/RecallQ.Api/Observability/CorrelationMiddleware.cs` uses `ToString("N")` format (no hyphens):

```csharp
id = parsed.ToString("N");  // Line 26 and 30
id = Guid.NewGuid().ToString("N");
```

## Repro

1. Make any API request
2. Check the `X-Correlation-Id` response header
3. Observe it's `32hexdigits` instead of `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## Notes

Radically simple fix:
- Change `ToString("N")` to `ToString("D")` on lines 26 and 30
- "D" format is the standard GUID format with hyphens
- This makes the header compatible with standard UUID/GUID parsers and more human-readable
