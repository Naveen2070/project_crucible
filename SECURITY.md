# Security Policy

## Supported Versions

Security fixes are applied to the latest minor release line. Older lines are not patched —
please upgrade to a supported version before reporting.

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| < 1.1   | :x:                |

## Reporting a Vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately through GitHub's built-in advisory flow:

1. Go to the repository's **[Security tab](https://github.com/Naveen2070/project_crucible/security)**.
2. Click **"Report a vulnerability"** to open a private security advisory.
3. Include a description, affected version, reproduction steps, and impact.

You can expect an initial acknowledgement within **5 business days**. Once a fix is prepared we
will coordinate a release and credit you in the advisory (unless you prefer to remain anonymous).

## Scope

Crucible is a **development-time code generator** distributed as a CLI. It writes source code
into your project and has **no runtime footprint** in your shipped application — generated
components carry zero Crucible dependency. The most relevant security surface is therefore:

- The CLI and its build/scaffolding pipeline (file writes, config parsing, plugin loading).
- The local plugin system (`.crucible/plugins/`), which executes only manifests and templates
  you place in your own repository.

Out of scope: vulnerabilities in code **you** subsequently write into generated files, and
issues in third-party frameworks (React, Vue, Angular) that generated code targets.
