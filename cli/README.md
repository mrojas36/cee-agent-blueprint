# CEE Agent CLI Architecture

The CEE Agent CLI is inspired by the developer-beloved Claude Code CLI but optimized for the **ShiftCore Causal Engine (V80 FPGA)**. 

Instead of relying on a traditional software-only LLM context window (which degrades over long sessions and forgets early context), this CLI acts as a **Hardware Memory Orchestrator**. 

## Core Philosophy: Hardware-Accelerated Context

In a traditional CLI (like Claude Code):
1. `GlobTool` / `GrepTool` finds code.
2. The raw text is appended to the LLM's `messages[]` array.
3. As the session grows, early codebase knowledge is pushed out or diluted (lost in the noise).

In the **CEE CLI**:
1. **Explore & Warm:** The CLI explores the codebase natively (using optimized Rust/Node bindings).
2. **Anchor Bank Injection:** Critical symbols, function signatures, and file paths are injected directly into the **Anchor Bank** (HBM) via the PL fabric. 
3. **Ghost Grounding:** The user's approved plan and checklist are injected into the **Ghost Tier**.
4. **Zero-Drift Inference:** When the LLM generates tokens, the hardware's *Semantic Curator* guarantees 100% recall of the Anchor and Ghost tiers, regardless of how long the conversation gets.

## Directory Structure

- `commands/` - Slash commands (e.g., `/explore`, `/plan`) that trigger hardware injections.
- `bridge/` - IDE integration daemon (VSCode/JetBrains) mirroring Claude Code's bridge architecture, allowing the IDE to passively warm the Anchor Bank as the user opens files.
- `triage/` - The software routing layer that decides if a token belongs in Anchor, Ghost, or Trash before hitting the hardware.
