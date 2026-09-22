# Trae — CentralizedHub default rules
# (one copy per project; shared template lives at centralizedhub/ide-shared)

Rules:
  - Prefer editing existing files. Create files only when necessary.
  - Shared tooling goes into @centralizedhub/* packages under centralizedhub.
  - Don't hardcode ports 3000-8000; use @centralizedhub/port-manager.
  - All i18n text must translate consistently (no mixed EN/ZH).
  - Screenshots go under project-local screenshots/<version>/ subfolders.
  - Do NOT commit IDE caches: .trae/cache, .vscode/Cache, .idea/workspace.xml
  - Use Trae Solo / Trae workflow. Cursor/VSCode/CodeBuddy defaults are kept minimal.
