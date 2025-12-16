# Shell - Build Your Own Shell

[![progress-banner](https://backend.codecrafters.io/progress/shell/bc0dd1f7-a0f8-4ac0-a076-e169ed84c482)](https://app.codecrafters.io/users/codecrafters-bot?r=2qF)
[![CI](https://github.com/proXDhiya/codecrafters-shell-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/proXDhiya/codecrafters-shell-typescript/actions/workflows/ci.yml)

A POSIX-compliant shell implementation built with **Bun** and **TypeScript** as part of the [CodeCrafters "Build Your Own Shell" Challenge](https://app.codecrafters.io/courses/shell/overview).

This shell is capable of interpreting shell commands, running external programs, executing builtin commands, handling I/O redirection, pipelines, tab completion, and command history.

## Features

- **Builtin Commands**: `echo`, `cd`, `pwd`, `exit`, `type`, `history`
- **External Command Execution**: Run any executable in `$PATH`
- **I/O Redirection**: `>`, `>>`, `1>`, `1>>`, `2>`, `2>>` for stdout/stderr
- **Pipelines**: Single and multi-command pipelines (`cmd1 | cmd2 | cmd3`)
- **Tab Completion**: Autocomplete commands with `<TAB>`, show matches on double-tap
- **Command History**: Persistent history with `-r`, `-w`, `-a` flags
- **Quoting & Escaping**: Single quotes, double quotes, backslash escaping

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.1.0

### Installation

```bash
# Clone the repository
git clone https://github.com/proXDhiya/codecrafters-shell-typescript.git
cd codecrafters-shell-typescript

# Install dependencies
bun install

# Run the shell
bun run dev
```

### Download Pre-built Binary

Download the latest Linux binary from [Releases](https://github.com/proXDhiya/codecrafters-shell-typescript/releases).

```bash
# Make it executable
chmod +x shell-linux-x64

# Run
./shell-linux-x64
```

## Architecture

```
app/
├── main.ts                 # Entry point - REPL loop with readline
├── commands/               # Builtin command implementations
│   ├── index.ts            # Command registry
│   ├── echo.ts             # echo command
│   ├── cd.ts               # cd command (with ~ expansion)
│   ├── pwd.ts              # pwd command
│   ├── exit.ts             # exit command
│   ├── type.ts             # type command (builtin vs external)
│   └── history.ts          # history command (-r, -w, -a flags)
├── registry/               # Global state registries
│   ├── commands.ts         # Builtin commands map
│   ├── path.ts             # PATH directories and resolve cache
│   └── history.ts          # Session and persistent history
└── utils/                  # Core utilities
    ├── parser.ts           # Command parsing (tokenization, quoting, redirects, pipes)
    ├── executor.ts         # Command execution (builtins, externals, pipelines)
    ├── completer.ts        # Tab completion logic
    ├── path.ts             # PATH resolution and command lookup
    └── types.ts            # TypeScript type definitions
```

## How It Works

### 1. REPL Loop (`main.ts`)

The shell runs a Read-Eval-Print Loop using Node's `readline` module:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Prompt    │ ──▶ │   Read      │ ──▶ │   Parse     │ ──▶ │   Execute   │
│   "$ "      │     │   Input     │     │   Command   │     │   Command   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │   Output    │
                                                            └─────────────┘
```

### 2. Parsing (`parser.ts`)

The parser handles:

- **Tokenization**: Splits input into tokens respecting quotes and escapes
- **Quote Handling**: Single quotes (literal), double quotes (with `\\` and `\"` escapes)
- **Redirect Detection**: `>`, `>>`, `2>`, `2>>` operators
- **Pipeline Splitting**: Splits on unquoted `|` characters

```typescript
parseLine("cat file.txt | head -n 3 | wc")
// Returns: { kind: "pipeline", commands: [...] }
```

### 3. Execution (`executor.ts`)

The executor handles three cases:

1. **Single Command**: Direct execution via builtin handler or `spawn()`
2. **Two-Command Pipeline**: Optimized path using direct pipe between processes
3. **Multi-Command Pipeline**: Generic handler supporting builtins anywhere in the pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│   cat    │ ──▶ │   head   │ ──▶ │   wc     │
│  stdout  │pipe │  stdout  │pipe │  stdout  │
└──────────┘     └──────────┘     └──────────┘
```

### 4. Tab Completion (`completer.ts`)

- First `<TAB>`: Complete if single match, or extend to longest common prefix
- Second `<TAB>`: Display all matching commands
- Searches both builtins and executables in `$PATH`

### 5. Command Resolution (`path.ts`)

- Caches resolved command paths for performance
- Handles absolute paths, relative paths (with `/`), and `$PATH` lookup
- Validates executability with `access(path, X_OK)`

## Development

### Scripts

```bash
bun run dev          # Run shell in development mode
bun run test         # Run all tests
bun run test:watch   # Run tests in watch mode
bun run test:cov     # Run tests with coverage
bun run build        # Build standalone binary
```

### Testing

The project includes comprehensive tests for all modules:

```bash
bun test
# 124 tests across 8 files
```

Test coverage includes:
- Parser (tokenization, quoting, escaping, redirects, pipelines)
- Builtin commands (echo, cd, pwd, type, history)
- Path resolution and caching
- Tab completion logic

### Pre-commit Hooks

Husky runs tests before each commit to ensure code quality.

## CodeCrafters Challenge

This project was built as part of the [CodeCrafters](https://codecrafters.io) "Build Your Own Shell" challenge. The challenge involves implementing a shell step-by-step:

1. **REPL**: Basic read-eval-print loop
2. **Builtins**: `echo`, `exit`, `type`, `pwd`, `cd`
3. **External Commands**: Execute programs from `$PATH`
4. **Quoting**: Single quotes, double quotes, backslash escaping
5. **Redirection**: stdout and stderr redirection
6. **Pipelines**: Single and multi-command pipelines
7. **Tab Completion**: Command autocompletion
8. **History**: Command history with persistence

## License

MIT
