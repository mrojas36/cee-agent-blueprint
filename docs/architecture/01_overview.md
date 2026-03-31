# CEE Agent Blueprint Architecture (PCIe Accelerator Model)

## Overview
The CEE Agent Blueprint defines the software orchestration stack (CLI, Daemon, IDE Bridge, and Host Driver) for the **ShiftCore Causal Engine (CEE)** built on the AMD Versal V80 FPGA.

This architecture has been updated to reflect the **Host PCIe Accelerator** model. The V80 card is a self-contained inference system running its own 7.6B parameter model (R1-Distill-Qwen-7B). The host's role is to provide semantic guidance via high-bandwidth PCIe DMA transfers to the card's HBM.

---

## 1. System Components

### A. IDE Extension (`/ide-extension`)
Acts as the developer's "intent sensor."
- **Passive Warming:** Monitors file focus and symbol visibility. Sends semantic metadata to the Bridge Daemon.
- **Mission Grounding UI:** Allows developers to highlight requirements and trigger a "Ground Mission" event, physically pinning the goal into the hardware's Ghost Tier.

### B. The Bridge Daemon (`/cli/bridge/daemon.ts`)
The central orchestrator running on the host machine (x86/Linux).
- **Triage & Embedding:** Receives IDE events. Converts mission text into mathematical SVD projections (via host-side embedding) before transmission.
- **DMA Management:** Batches semantic anchors and mission vectors for high-efficiency PCIe DMA transfers.

### C. The CEE CLI & SDK (`/cli`, `/sdk`)
- **`/explore` Command:** Rapidly parses the workspace. Bulk-loads the entire codebase's "skeleton" (symbol signatures/paths) into the HBM-backed Anchor Bank via DMA.
- **`/plan` Command:** Finalizes the implementation strategy and grounds the **Grounding Ghost (GG)** into the hardware.

### D. PCIe Host Driver & System Code (`/system-code/src/cee-pcie-host.c`)
The physical interface layer.
- **BAR0 Mapping:** Communicates with the bare-metal A72 orchestrator via the `apu_hello` mailbox (PCIe offset `0x1003000`).
- **DMA Engine:** Streams bulk data directly to HBM address space (`0x40_0000_0000+`).
- **Token Streaming:** Pulls generated tokens from the card's HBM ring buffer back to the host UI.

---

## 2. Hardware Memory Integration

The software stack is designed to feed the multi-tier memory architecture of the CEE:

### The Anchor Bank (CAM + HBM)
- **HBM Backing Store:** Holds up to 4.8M compressed symbols (27GB capacity).
- **CAM (64-entry Cache):** The hottest symbols are promoted to the Content Addressable Memory for <1µs lookup.
- **Orchestration:** The hardware **Saliency Controller** manages eviction autonomously based on token utility; the host simply ensures the HBM store is warmed.

### The Ghost Tier (SVD Projections)
- **Grounding Ghost (GG):** The mission statement, represented as a 192-byte rank-2 SVD projection.
- **L7 Judgment Controller:** The **Judgment Controller** (`0xA40B0000`) continuously audits the on-card model's generation against the GG. If the "Reasoning Ghost" drifts from the mission, the hardware triggers a guided search to auto-correct.

---

## 3. Data Flow: Host-to-Silicon

1. **Host-Side (x86):** CLI/IDE Bridge extracts symbols and embeds missions.
2. **PCIe Transfer:** Data is pushed via **DMA** to the V80's HBM.
3. **Mailbox Signal:** Host writes to `apu_hello` mailbox to notify the bare-metal A72.
4. **On-Card Execution:** The A72 firmware triggers a `reanchor()` or `session_init()`.
5. **Governed Generation:** The parallel vector engine (7,200 DSP58s) generates tokens, governed by the CEE's L0-L7 layers for 100% recall and zero drift.
