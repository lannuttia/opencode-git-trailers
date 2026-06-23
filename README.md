# opencode-git-trailers

[![CI](https://github.com/lannuttia/opencode-git-trailers/actions/workflows/ci.yml/badge.svg)](https://github.com/lannuttia/opencode-git-trailers/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/lannuttia/opencode-git-trailers/graph/badge.svg)](https://codecov.io/gh/lannuttia/opencode-git-trailers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/lannuttia/opencode-git-trailers/blob/main/LICENSE)
[![Snyk Vulnerabilities](https://snyk.io/test/github/lannuttia/opencode-git-trailers/badge.svg)](https://security.snyk.io/package/npm/opencode-git-trailers)

OpenCode plugin that automatically adds git trailers to commits made through OpenCode.

## Problem

Some projects require commits created with AI assistance to include metadata denoting this fact. Git trailers provide a standardized way to add such metadata to commit messages. This plugin ensures that trailers are deterministically added to all commits made through OpenCode.

## What It Does

This plugin creates a temporary git commit-msg hook that automatically appends configured trailers to commit messages using `git interpret-trailers`. The hook is installed before commits made through OpenCode and automatically cleaned up afterward. Trailers are added to the end of the commit message following the [git trailer format](https://git-scm.com/docs/git-interpret-trailers).

## Installation

```bash
npm install opencode-git-trailers
```

## Usage

### Basic Setup

Add the plugin to your OpenCode configuration:

```json
{
  "plugins": ["opencode-git-trailers"]
}
```

### Configuration

This plugin uses a hybrid approach combining OpenCode-specific configuration with Git's standard trailer system:

1. **`opencode.trailers.*`** - Specifies which trailers to add and their value templates
2. **`trailer.*` (optional)** - Git's standard trailer config for controlling key formatting

#### Quick Start (Minimal Setup)

```bash
# Add trailers with default (lowercase) formatting
git config --global opencode.trailers.model '{{model}}'
git config --global opencode.trailers.co-authored-by 'AI Assistant <ai@opencode.ai>'
```

Result:
```
model: claude-sonnet-4-5@20250929
co-authored-by: AI Assistant <ai@opencode.ai>
```

#### Recommended Setup (With Proper Capitalization)

For properly capitalized trailer keys, combine OpenCode config with Git's standard trailer formatting:

```bash
# Define trailer key formatting (standard Git config)
git config --global trailer.model.key "Model"
git config --global trailer.co-authored-by.key "Co-authored-by"
git config --global trailer.signed-off-by.key "Signed-off-by"

# Specify which trailers OpenCode should add (OpenCode-specific config)
git config --global opencode.trailers.model '{{model}}'
git config --global opencode.trailers.co-authored-by 'AI Assistant <ai@opencode.ai>'
git config --global opencode.trailers.signed-off-by '{{user.name}} <{{user.email}}>'
```

Result:
```
Model: claude-sonnet-4-5@20250929
Co-authored-by: AI Assistant <ai@opencode.ai>
Signed-off-by: John Doe <john@example.com>
```

#### Per-Repository Configuration

Configure trailers for a specific repository by running commands within the repository directory (omit `--global` flag):

```bash
# Navigate to your repository
cd /path/to/your/repo

# Define formatting
git config trailer.model.key "Model"

# Specify what to add
git config opencode.trailers.model '{{model}}'
```

Per-repository configuration overrides global configuration for the same trailer key.

### Variable Interpolation

Trailers support variable interpolation to include contextual information such as the model used:

```bash
# Configure a trailer with model interpolation
git config opencode.trailers.model '{{model}}'

# Use git user information
git config opencode.trailers.signed-off-by '{{user.name}} <{{user.email}}>'
```

#### Available Variables

- `{{model}}` - The model identifier used for the commit
- `{{provider}}` - The provider name (e.g., "anthropic", "openai")
- `{{timestamp}}` - ISO 8601 timestamp of the commit
- `{{session}}` - OpenCode session ID
- `{{user.name}}` - Git user name from git config
- `{{user.email}}` - Git user email from git config

### How It Works

The plugin uses a two-step configuration system:

1. **OpenCode Configuration** (`opencode.trailers.*`):
   - Determines **which** trailers are added to OpenCode commits
   - Provides **value templates** with variable interpolation (e.g., `{{model}}`)
   - **Required** for trailers to be added

2. **Git Trailer Configuration** (`trailer.*.key`, optional):
   - Controls **how** trailer keys are formatted in the commit message
   - If present, Git formats the trailer key according to this setting
   - If absent, the key from `opencode.trailers.*` is passed to `git interpret-trailers` as-is, which formats it according to Git's default trailer rules

**Example:**
```bash
# The config key name creates the association:
git config trailer.model.key "Model"           # ← Formats "model" as "Model"
git config opencode.trailers.model '{{model}}'  # ← Adds trailer "model"
```

When OpenCode makes a commit, it generates: `--trailer "model:claude-4"`  
Git interpret-trailers formats it as: `Model: claude-4`

### Additional Features

#### Hook Chaining

If your repository already has a `commit-msg` hook, this plugin will preserve and chain to it. The existing hook runs first, then the trailers are added. When the commit completes, your original hook is restored.

#### Graceful Error Handling

If the plugin encounters an error (e.g., unable to create the hook file), it logs the error but allows the commit to proceed without trailers. This ensures the plugin never blocks your commits.

#### Variable Filtering

Trailers with undefined or uninterpolated variables are automatically filtered out. For example, if `{{provider}}` is not available, a trailer configured as `provider: {{provider}}` will not be added to the commit.

### Upgrading from Previous Versions

**Version 0.1.3 and earlier** automatically capitalized the first letter of trailer keys.  
**Version 0.1.4+** relies on Git's standard `trailer.*.key` configuration for formatting.

If upgrading, your trailers will appear in lowercase unless you add `trailer.*.key` configuration:

```bash
# For each trailer, add the corresponding formatting config
git config --global trailer.model.key "Model"
git config --global trailer.session.key "Session"
git config --global trailer.co-authored-by.key "Co-authored-by"
git config --global trailer.signed-off-by.key "Signed-off-by"
```

### Example Commit Message

Before this plugin:

```
Add user authentication

This commit implements JWT-based authentication
for the API endpoints.
```

After this plugin (with configured trailers):

```
Add user authentication

This commit implements JWT-based authentication
for the API endpoints.

Model: claude-sonnet-4-5@20250929
Co-authored-by: AI Assistant <ai@opencode.ai>
Signed-off-by: John Doe <john@example.com>
```

## Development

### Prerequisites

- [Bun](https://bun.sh) 1.x or later

### Setup

```bash
bun install
```

### Build

```bash
bun run build
```

### Test

```bash
# Run tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Lint

```bash
bun run lint
```

## License

MIT
