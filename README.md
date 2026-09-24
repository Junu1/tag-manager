# 🏷️ Tag Manager

A **cross-platform** CLI tool for managing semantic versioning tags in Git repositories with `package.json` support.

Works on **Windows**, **macOS**, and **Linux** — anywhere Node.js runs.

## Features

- 🎯 **Interactive mode** — menu-driven interface for quick tagging
- ⚡ **Command-line mode** — `--major`/`--minor`/`--patch` flags for 3-digit tags, subcommands for 5-digit tags
- 📦 **Two versioning schemes** — 3-digit `Major.Minor.Patch` or 5-digit `Product.Major.Minor.Maintenance.Hotfix`, chosen by the command you run
- 🏗️ **Project prefix** — optional prefix for monorepo/multi-project tags (e.g., `xp-v1.0.0.0.0`)
- 📝 **Auto-updates** `package.json` and `package-lock.json`
- 🔖 **Git tag creation** — annotated tags with automatic commit
- 📜 **Version history** — view recent tags at a glance
- ✅ **Safety checks** — validates clean working tree and prevents duplicate tags
- 🎨 **Colored output** — clear, readable terminal output

## Prerequisites

- [Node.js](https://nodejs.org/) >= 16
- [Git](https://git-scm.com/)

### Global install

```bash
npm install -g tag-manager
```

## Usage

### Interactive Mode

Run without any arguments to launch the interactive menu:

```bash
tag
```

The menu lists both schemes:

```
──────────────────────────────────────────────────
  🏷️  Tag Manager
──────────────────────────────────────────────────

Current version: 1.0.0

? Select an action:
  ── 3-digit ──
  ❯ Major       (X.0.0) — Breaking changes
    Minor       (x.X.0) — New features
    Patch       (x.x.X) — Bug fixes
  ── 5-digit ──
    Product     (X.0.0.0.0) — New product line
    Major       (x.X.0.0.0) — Breaking changes
    Minor       (x.x.X.0.0) — New features
    Maintenance (x.x.x.X.0) — Bug fixes
    Hotfix      (x.x.x.x.X) — Quick fixes
    ──────────────
    View version history
    Exit
```

### Command-Line Mode

Flags create **3-digit** tags, subcommands create **5-digit** tags:

```bash
# 3-digit: <Major>.<Minor>.<Patch>
tag --major      # X.0.0
tag --minor      # x.X.0
tag --patch      # x.x.X

# 5-digit: <Product>.<Major>.<Minor>.<Maintenance>.<Hotfix>
tag product      # X.0.0.0.0
tag major        # x.X.0.0.0
tag minor        # x.x.X.0.0
tag maintenance  # x.x.x.X.0
tag hotfix       # x.x.x.x.X

tag history      # View recent version history
```

### How versions are calculated

The current `package.json` version (3, 4 or 5 digits) is first fitted to the
chosen scheme: extra digits are dropped, missing digits are `0`. Then the chosen
digit is incremented and every digit after it resets to `0` (Customized Git Flow SOP).

| Command           | From `1.2.3`  | From `2.3.4.5.6` |
| ----------------- | ------------- | ---------------- |
| `tag --major`     | `2.0.0`       | `3.0.0`          |
| `tag --minor`     | `1.3.0`       | `2.4.0`          |
| `tag --patch`     | `1.2.4`       | `2.3.5`          |
| `tag product`     | `2.0.0.0.0`   | `3.0.0.0.0`      |
| `tag major`       | `1.3.0.0.0`   | `2.4.0.0.0`      |
| `tag minor`       | `1.2.4.0.0`   | `2.3.5.0.0`      |
| `tag maintenance` | `1.2.3.1.0`   | `2.3.4.6.0`      |
| `tag hotfix`      | `1.2.3.0.1`   | `2.3.4.5.7`      |

### Project Prefix

Add an optional project prefix to scope tags for monorepos:

```bash
tag --patch api     # 1.0.0     → api-v1.0.1
tag maintenance xp  # 1.0.0.0.0 → xp-v1.0.0.1.0
```

### Help

```bash
tag --help
tag minor --help
```

## How It Works

1. Reads the current version from `package.json`
2. Calculates the next version based on bump type
3. Updates `package.json` (and `package-lock.json` if present)
4. Commits the version change
5. Creates an annotated git tag
6. Prints push instructions

## Migrating from v1 (Bash)

If you were using the original bash script, the CLI arguments have changed slightly:

| Bash (v1)         | Node.js (v2)    |
| ----------------- | --------------- |
| `tag --major`     | `tag --major`   |
| `tag --minor`     | `tag --minor`   |
| `tag --minor xp`  | `tag --minor xp` |
| `tag --history`   | `tag history`   |
| `tag` (no args)   | `tag` (no args) |

## License

[MIT](LICENSE)
