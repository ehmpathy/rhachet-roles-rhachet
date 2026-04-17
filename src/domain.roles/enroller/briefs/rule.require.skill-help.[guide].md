# rule: --help flag required

## .what

all skills must support a `--help` flag that explains usage.

## .why

- **discoverability**: users can learn how to use a skill without source code
- **self-document**: the skill itself is the source of truth for its interface
- **unix convention**: standard CLI tools support `--help`; skills should too
- **ai ergonomics**: agents can invoke `--help` to understand a skill before use

---

## pattern

### minimum viable help

```
🐢 heres the wave...

🐚 {skill-name} --help
   ├─ purpose: {one-line description}
   ├─ usage: {skill-name} [options] {args}
   └─ options
      ├─ --help: show this message
      ├─ --mode: plan (default) | apply
      └─ --{option}: {description}
```

### example

```
🐢 heres the wave...

🐚 sedreplace --help
   ├─ purpose: find and replace text across files
   ├─ usage: sedreplace --old <pattern> --new <replacement> --glob <pattern>
   └─ options
      ├─ --help: show this message
      ├─ --old: text or regex to find (required)
      ├─ --new: replacement text (required)
      ├─ --glob: file pattern to search (required)
      └─ --mode: preview (default) | apply
```

---

## requirements

| requirement | rationale |
|-------------|-----------|
| exit code 0 | help is successful output, not an error |
| stdout | help output is data, not diagnostics |
| no side effects | `--help` must never modify state |
| treestruct format | consistent with other skill output |

---

## enforcement

- skill without `--help` support = blocker
- `--help` that exits non-zero = blocker
- `--help` that produces side effects = blocker
