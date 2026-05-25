# PROJECT_RULES.md
## Revised Project Rules – Current Project Compliance
Generated: 2025-11-06
Version: 3.1 – Enforcement & Compliance

### Purpose
These rules define a strict enforcement framework for the current project. They ensure that all ongoing work, commits, fixes, and modifications adhere to the highest standards of structure, code quality, UI, performance, security, and validation.

---

### GROUP 1: CODE QUALITY & DOCUMENTATION
**Rule 1: Keep all documentation complete, concise, and current.**
- Maintain a clear, up-to-date README.
- Document all public APIs as applicable.
- Include inline code comments (≥10% coverage).
- Ensure package.json contains a correct description.
- Keep documentation under version control.

**Rule 2: Enforce automated quality and security checks.**
- Lint, test, and verify code automatically.
- Detect and resolve style, quality, and complexity issues.
- Flag deprecated or unsafe patterns (var, eval, with, innerHTML, document.write).
- Remove console statements in production.

**Rule 3: Maintain clean and up-to-date dependencies.**
- Detect deprecated or unmaintained packages.
- Ensure consistent import/export usage.
- Monitor cross-file reference integrity.

---

### GROUP 2: FILE ORGANIZATION & STRUCTURE
**Rule 4: Maintain a unified file structure based on project type.**
- **React Native/Expo**: app/, components/, assets/, tests/, docs/, scripts/, constants/, lib/, hooks/
- **Web Projects**: src/, tests/, docs/, scripts/, config/, public/

**Rule 5: Maintain consistent project layout.**
- PascalCase → Components
- camelCase → Utilities
- UPPER_SNAKE_CASE → Constants

---

### GROUP 3: CHANGE MANAGEMENT
**Rule 6: Evaluate every change before applying.**
- Review affected code, configs, and tests.
- Map dependencies and imports.

**Rule 7: Simulate and validate changes.**
- Run dry-run simulations before committing.
- Backup files with timestamps.
- Validate syntax and compatibility.

**Rule 8: Maintain clear and reversible change history.**
- Log all changes in AGENTS.md with timestamps.
- Use Git branching for versioning.
- Support instant rollback to stable states.

---

### GROUP 4: VALIDATION & QUALITY CONTROL
**Rule 9: Ensure all tasks are fully validated.**
- Track tasks from initiation to closure.
- Verify task-specific criteria before marking complete.

**Rule 10: Verify every modification immediately.**
- Confirm file operations and command execution results.
- Check syntax, quality, and regression compliance.

**Rule 11: Enforce mandatory quality gates.**
- Minimum success rate: ≥80% on defined metrics.
- Document and review critical or security-sensitive changes manually.

---

### GROUP 5: FINAL VERIFICATION & STABILITY
**Rule 12: Ensure project-wide stability.**
- Validate file permissions, syntax, and functionality.
- Detect and remove leftover debug or temporary code.

**Rule 13: Certify task completion.**
- Cross-verify via unified validation tools.
- Maintain logs, summaries, and audit history.

---

### IMPLEMENTATION WORKFLOW
1. `./scripts/unified-quality-system.sh` (Rules 1–3)
2. `./scripts/file-structure-manager.sh` (Rules 4–5)
3. `./scripts/change-manager.sh` (Rules 6–8)
4. `./scripts/validation-suite.sh` (Rules 9–11)
