# 🏷️ Tag Manager

A **cross-platform** CLI tool for managing semantic versioning tags in Git repositories with `package.json` support.

Works on **Windows**, **macOS**, and **Linux** — anywhere Node.js runs.

## Features

- 🎯 **Interactive mode** — menu-driven interface for quick tagging
- ⚡ **Command-line mode** — direct version bumping via subcommands
- 📦 **Two versioning schemes** — 3-digit `Major.Minor.Patch` or 5-digit `Product.Major.Minor.Maintenance.Hotfix`, detected from `package.json`
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
npm install -g @junu1/tag-manager
```

## Usage

### Interactive Mode

Run without any arguments to launch the interactive menu:

```bash
tag
```

The menu matches your current version's scheme. For a 5-digit version:

```
──────────────────────────────────────────────────
  🏷️  Tag Manager
──────────────────────────────────────────────────

Current version: 1.0.0.0.0

? Select an action:
  ❯ Product     (X.0.0.0.0) — New product line
    Major       (x.X.0.0.0) — Breaking changes
    Minor       (x.x.X.0.0) — New features
    Maintenance (x.x.x.X.0) — Bug fixes
    Hotfix      (x.x.x.x.X) — Quick fixes
    ──────────────
    View version history
    Exit
```

For a 3-digit version it shows `Major (X.0.0)`, `Minor (x.X.0)` and `Patch (x.x.X)` instead.

### Versioning schemes

The scheme is picked from the number of digits in `package.json`'s `version`,
and new versions keep the same number of digits:

| Digits | Format                                          | Bumps                                               |
| ------ | ----------------------------------------------- | --------------------------------------------------- |
| 3      | `<Major>.<Minor>.<Patch>`                       | `major`, `minor`, `patch`                           |
| 5      | `<Product>.<Major>.<Minor>.<Maintenance>.<Hotfix>` | `product`, `major`, `minor`, `maintenance`, `hotfix` |

Other formats (e.g. `1.2.3.4`) are rejected. Using a bump that doesn't belong to
the current scheme (e.g. `tag hotfix` on `1.2.3`) is an error.

Each bump increments its own digit and resets every digit after it to `0`
(Customized Git Flow SOP). For example:

| Bump          | From `1.2.3` | From `2.3.4.5.6` |
| ------------- | ------------ | ---------------- |
| `product`     | —            | `3.0.0.0.0`      |
| `major`       | `2.0.0`      | `2.4.0.0.0`      |
| `minor`       | `1.3.0`      | `2.3.5.0.0`      |
| `patch`       | `1.2.4`      | —                |
| `maintenance` | —            | `2.3.4.6.0`      |
| `hotfix`      | —            | `2.3.4.5.7`      |

### Command-Line Mode

For direct version bumping, use subcommands:

```bash
# 3-digit versions
tag major        # Bump major version (X.0.0)
tag minor        # Bump minor version (x.X.0)
tag patch        # Bump patch version (x.x.X)

# 5-digit versions
tag product      # Bump product version (X.0.0.0.0)
tag major        # Bump major version (x.X.0.0.0)
tag minor        # Bump minor version (x.x.X.0.0)
tag maintenance  # Bump maintenance version (x.x.x.X.0)
tag hotfix       # Bump hotfix version (x.x.x.x.X)

tag history      # View recent version history
```

### Project Prefix

Add an optional project prefix to scope tags for monorepos:

```bash
tag patch api       # 1.0.0     → api-v1.0.1
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
| `tag --major`     | `tag major`     |
| `tag --minor`     | `tag minor`     |
| `tag --minor xp`  | `tag minor xp`  |
| `tag --history`   | `tag history`   |
| `tag` (no args)   | `tag` (no args) |

## License

[MIT](LICENSE)
