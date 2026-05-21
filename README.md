# opencode-git-trailers

OpenCode plugin that automatically adds git trailers to commits made through OpenCode.

## Problem

Some projects require commits created with AI assistance to include metadata denoting this fact. Git trailers provide a standardized way to add such metadata to commit messages. This plugin ensures that trailers are deterministically added to all commits made through OpenCode.

## What It Does

This plugin intercepts `git commit` commands invoked by OpenCode and automatically appends configured trailers to the commit message. Trailers are added to the end of the commit message following the [git trailer format](https://git-scm.com/docs/git-interpret-trailers).

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

Configure trailers using git config with the `opencode.git-trailers` prefix.

#### Global Configuration

Configure trailers globally to apply to all repositories:

```bash
# Add the model used for the commit
git config --global opencode.git-trailers.model '{{model}}'

# Add yourself as a co-author with the AI
git config --global opencode.git-trailers.co-authored-by 'AI Assistant <ai@opencode.ai>'

# Add a signed-off-by trailer
git config --global opencode.git-trailers.signed-off-by '{{user.name}} <{{user.email}}>'
```

#### Per-Repository Configuration

Configure trailers for a specific repository by running commands within the repository directory:

```bash
# Navigate to your repository
cd /path/to/your/repo

# Add the model used for the commit (repository-specific)
git config opencode.git-trailers.model '{{model}}'

# Add a signed-off-by trailer (repository-specific)
git config opencode.git-trailers.signed-off-by '{{user.name}} <{{user.email}}>'
```

Per-repository configuration overrides global configuration for the same trailer key.

#### Result

These configuration options result in the following trailers being added to commits:

```
Model: claude-sonnet-4-5@20250929
Co-authored-by: AI Assistant <ai@opencode.ai>
Signed-off-by: John Doe <john@example.com>
```

### Variable Interpolation

Trailers support variable interpolation to include contextual information such as the model used:

```bash
# Configure a trailer with model interpolation
git config opencode.git-trailers.model '{{model}}'

# Use git user information
git config opencode.git-trailers.signed-off-by '{{user.name}} <{{user.email}}>'
```

#### Available Variables

- `{{model}}` - The model identifier used for the commit
- `{{provider}}` - The provider name (e.g., "anthropic", "openai")
- `{{timestamp}}` - ISO 8601 timestamp of the commit
- `{{session}}` - OpenCode session ID
- `{{user.name}}` - Git user name from git config
- `{{user.email}}` - Git user email from git config

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
