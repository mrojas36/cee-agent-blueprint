# Request for Feedback: CEE Software Orchestration Stack (CLI/IDE)

**To:** Hardware Team, Design Team
**From:** Software Team (SDK/CLI)
**Date:** March 31, 2026
**Subject:** Integration Architecture: Mapping Software Context to the ShiftCore Hardware Memory Tiers

---

## Executive Summary

We are building the developer-facing software stack (SDK, CLI, IDE Bridge) that interfaces with the new ShiftCore Causal Engine on the AMD V80 FPGA. 

Our goal is to solve the two biggest complaints developers have with current AI agents (Context Overflow/Recall Loss, and Goal Drift) by completely bypassing traditional "software context stuffing" and instead pushing critical context directly into your hardware memory tiers (the Anchor Bank and Ghost Tier).

We have scaffolded a working blueprint and would like your feedback on our proposed integration points across the PS/PL boundary.

## What We Are Building

We have designed a 4-layer orchestration stack:

1. **The IDE Extension (VSCode/JetBrains):** 
   Acts as the passive "eyes" of the agent. As a developer navigates their codebase, the extension extracts AST symbols and file paths. It also allows developers to highlight text and trigger a "Ground Mission" command.
2. **The Bridge Daemon:**
   A background process running on the host machine. It receives the high-volume event stream from the IDE, batches the payloads, and triages them.
3. **The CEE CLI & SDK (`cee explore`, `cee plan`):**
   The primary interface. It provides native commands to bulk-parse a workspace and format the data for injection.
4. **The System Code (`cee-uio.c`):**
   The lowest-level C bindings running on the A72 PetaLinux processor. This translates the Daemon's requests into physical memory writes across the `M_AXI_FPD` bridge.

## How We Map to Your Hardware

We are mapping traditional AI software concepts directly to your hardware tiers:

### 1. Solving Recall Loss via the Anchor Bank
Instead of piping `ripgrep` results into a bloated LLM `messages[]` array (which degrades quickly), we use our CLI's `/explore` command and IDE Bridge to actively push `KEY=VALUE` pairs into the **Anchor Bank**.
*   **What we inject:** `[SYMBOL:authenticateUser] = File: auth.py | Signature: (token: string) -> boolean`
*   **The Theory:** When the LLM generates tokens, the CAM triggers a hit on `authenticateUser` and retrieves the signature with 100% fidelity, regardless of how much noise is in the Rolling Buffer.

### 2. Solving Goal Drift via the Ghost Tier
Instead of relying on an LLM to remember a software "Todo List" over 100,000 tokens of generation, we use our CLI's `/plan` command to take an approved mission statement and physically pin it to the **Ghost Tier**.
*   **What we inject:** `[MISSION] = Refactor auth.py to use OAuth2 without breaking existing signatures.`
*   **The Theory:** Because the Ghost Tier is shielded from the Rolling Buffer eviction policy, the attention heads are permanently grounded to the mission statement.

---

## Questions for Hardware / Design Teams

To ensure our software stack aligns with your silicon implementation, we need feedback on the following integration points:

1. **Bandwidth & Batching (M_AXI_FPD Bridge):** 
   As the developer scrolls rapidly through a codebase, our IDE daemon will generate a high volume of `AnchorEntry` updates. What is the optimal batch size or rate limit for writing to `0xA0000000` via `/dev/mem` without stalling the A72 or the PL fabric?
2. **Anchor Bank LRU/Eviction:** 
   Our CLI can aggressively parse a massive monorepo (e.g., millions of symbols). Does the Anchor Bank have a native LRU (Least Recently Used) hardware eviction policy, or does our Daemon need to track usage and send explicit `DELETE` commands when the CAM is full?
3. **Ghost Tier Constraints:** 
   We want to inject "Constraints" (e.g., `DO_NOT_HALLUCINATE_APIS`) alongside the raw mission text into the Ghost Tier. Does the `constraints_flags` register in your spec map to specific attention-masking behaviors, or should we just append these constraints as raw text to the `mission` payload?
4. **Hardware ACK Latency:**
   In our mock C driver, we are assuming a ~50µs ACK latency for an Anchor write and ~150µs for a Ghost write. Are these assumptions accurate for the final silicon?

We've uploaded our architectural blueprint (`cee-agent-blueprint/docs/architecture/01_overview.md`) and mock driver (`cee-uio.c`) to the repo. Looking forward to aligning our layers!
