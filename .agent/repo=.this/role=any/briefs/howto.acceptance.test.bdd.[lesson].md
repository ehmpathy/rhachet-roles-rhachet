# how to write bdd-style acceptance tests

## structure

use `given`, `when`, `then` from `test-fns` to structure tests:

```ts
import { given, when, then, useBeforeAll } from 'test-fns';

describe('featureName', () => {
  given('[case1] scenario description', () => {
    when('[t0] before any changes', () => {
      then('precondition holds', async () => { ... });
      then('another precondition holds', async () => { ... });
    });

    when('[t1] target operation is executed', () => {
      then('expected outcome', async () => { ... });
    });

    when('[t2] alternate operation is executed', () => {
      then('alternate outcome', async () => { ... });
    });
  });
});
```

---

## labels

### `[caseN]` for given blocks

each `given` block should have a unique case label:

```ts
given('[case1] valid inputs', () => { ... });
given('[case2] invalid inputs', () => { ... });
given('[case3] edge case scenario', () => { ... });
```

### `[tN]` for when blocks

each `when` block should have a time index label:

- `[t0]` = precondition checks / before any changes
- `[t1]` = first target operation
- `[t2]` = second target operation
- etc.

```ts
given('[case1] example repo', () => {
  when('[t0] before any changes', () => {
    then('config glob matches 2 files', ...);
    then('source glob matches 3 files', ...);
  });

  when('[t1] operation on valid input', () => {
    then('output is valid', ...);
  });

  when('[t2] operation on invalid input', () => {
    then('output contains errors', ...);
  });
});
```

---

## principles

### consolidate related tests

don't split related scenarios across multiple `given` blocks:

```ts
// ❌ bad - fragmented
given('[case8] config enumeration', () => { ... });
given('[case9] source enumeration', () => { ... });
given('[case10] operation works', () => { ... });

// ✅ good - consolidated
given('[case8] example repo', () => {
  when('[t0] before any changes', () => {
    then('config glob matches', ...);
    then('source glob matches', ...);
  });
  when('[t1] operation on valid input', () => { ... });
  when('[t2] operation on invalid input', () => { ... });
});
```

### when describes state/time, not action

```ts
// ❌ bad - describes action
when('[t0] assets are checked', () => { ... });

// ✅ good - describes state/time
when('[t0] before any changes', () => { ... });
```

### use afterEach for cleanup

```ts
// ❌ bad - inline cleanup
then('creates output file', async () => {
  const result = await doThing();
  await fs.rm(outputPath); // cleanup inside then
  expect(result).toBeDefined();
});

// ✅ good - afterEach cleanup
when('[t1] operation runs', () => {
  const outputPath = path.join(os.tmpdir(), 'output.md');
  afterEach(async () => fs.rm(outputPath, { force: true }));

  then('creates output file', async () => {
    const result = await doThing();
    expect(result).toBeDefined();
  });
});
```

### preconditions shouldn't expect errors

```ts
// ❌ bad - precondition expects error then checks it's not a validation error
then('does not throw validation errors', async () => {
  const error = await getError(doThing());
  expect(error.message).not.toContain('validation');
});

// ✅ good - precondition checks assets directly
then('rules glob matches 2 files', async () => {
  const files = await enumFiles({ glob: 'rules/*.md' });
  expect(files).toHaveLength(2);
});
```

### use useBeforeAll for shared setup

```ts
given('[case1] scenario with shared setup', () => {
  const scene = useBeforeAll(async () => {
    const entity = await createEntity();
    return { entity };
  });

  when('[t1] operation runs', () => {
    then('uses shared entity', async () => {
      const result = await doThing({ id: scene.entity.id });
      expect(result).toBeDefined();
    });
  });
});
```

---

## complete example

```ts
import { given, when, then, useBeforeAll } from 'test-fns';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('myOperation', () => {
  given('[case1] example repo', () => {
    when('[t0] before any changes', () => {
      then('config glob matches 2 files', async () => {
        const configFiles = await enumFilesFromGlob({
          glob: 'config/*.yml',
          cwd: ASSETS_DIR,
        });
        expect(configFiles).toHaveLength(2);
      });

      then('source glob matches 3 files', async () => {
        const sourceFiles = await enumFilesFromGlob({
          glob: 'src/*.ts',
          cwd: ASSETS_DIR,
        });
        expect(sourceFiles).toHaveLength(3);
      });
    });

    when('[t1] operation on valid input', () => {
      const outputPath = path.join(os.tmpdir(), 'output-valid.md');
      afterEach(async () => fs.rm(outputPath, { force: true }));

      then('output is valid', async () => {
        const result = await myOperation({
          input: 'valid-input.ts',
          output: outputPath,
          cwd: ASSETS_DIR,
        });
        expect(result.success).toBe(true);
      });
    });

    when('[t2] operation on invalid input', () => {
      const outputPath = path.join(os.tmpdir(), 'output-invalid.md');
      afterEach(async () => fs.rm(outputPath, { force: true }));

      then('output contains errors', async () => {
        const result = await myOperation({
          input: 'invalid-input.ts',
          output: outputPath,
          cwd: ASSETS_DIR,
        });
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });
});
```
