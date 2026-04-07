# rule: stderr for errors

## .what

when a skill exits with error code (1 or 2), all error messages must go to `stderr`, not `stdout`.

## .why

- **cli hook visibility**: tools like claude code show stderr separately from stdout. messages on stdout may be truncated or hidden when a hook exits non-zero.
- **unix convention**: stderr is for errors and diagnostics; stdout is for program output.
- **pipe safety**: when stdout is piped, error messages on stdout corrupt the data stream.

---

## pattern

```typescript
// good — errors go to stderr
if (blocked) {
  console.error('blocked by guard');
  process.exit(2);
}

// bad — errors go to stdout
if (blocked) {
  console.log('blocked by guard');   // WRONG: goes to stdout
  process.exit(2);
}
```

```bash
# good — errors go to stderr
echo "error: invalid input" >&2
exit 2

# bad — errors go to stdout
echo "error: invalid input"  # WRONG: goes to stdout
exit 2
```

---

## exit codes

| code | semantics | stderr content |
|------|-----------|----------------|
| 0 | success | none required |
| 1 | malfunction | error message + context |
| 2 | constraint | what user must fix |

---

## exception

structured output that happens to indicate failure (e.g., `{ "passed": false }`) may use stdout since the exit code communicates success/failure and the output is data, not a message.
