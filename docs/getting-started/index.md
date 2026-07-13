# Getting Started

Stocket is a tenant-aware inventory application built from independent backend,
frontend, shared-package, and support repositories. The `meta` project assembles
the supported local development checkout.

## Prerequisites

- Node.js 22 and pnpm 10.28.0
- Git and Docker Compose
- GitHub Packages credentials (`read:packages`)
- Infisical access for runtime secrets
- Nix is optional; several repositories provide their own flake

## Path Through This Guide

1. [Installation](installation.md) — authenticate, bootstrap, and start the stack
2. [Quick Start](quick-start.md) — seed a tenant and exercise the real product,
   location, and inventory workflow
3. [Configuration](configuration.md) — understand runtime boundaries and find
   the complete environment reference

Developers should continue with the [Project and Module Map](../development/project-map.md).
