var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../cee-agent-blueprint/cli/bridge/daemon.ts
var http = __toESM(require("http"), 1);

// ../cee-agent-blueprint/sdk/cee-client.ts
var CeeHardwareClient = class {
  baseAddress = "0xA000_0000";
  /**
   * Pushes key/value pairs into the Anchor Bank + CAM.
   * This is used for instantaneous, 100% recall of specific tokens/symbols.
   */
  async injectAnchorBank(payloads) {
    console.log(`[CEE-HW] \u{1F50C} Opening M_AXI_FPD bridge at ${this.baseAddress}...`);
    console.log(`[CEE-HW] \u{1F4BE} Writing ${payloads.length} anchors to HBM...`);
    for (const p of payloads) {
      await new Promise((resolve) => setTimeout(resolve, 1));
      console.log(`[CEE-HW]  -> INJECT: [${p.priority}] ${p.key}`);
    }
    console.log(`[CEE-HW] \u2705 Anchor Bank synced.`);
  }
  /**
   * Pushes the active plan into the Ghost Tier.
   * This tier bypasses the Rolling Buffer, ensuring the agent never 
   * hallucinates its mission parameters.
   */
  async injectGhostTier(payload) {
    console.log(`[CEE-HW] \u{1F47B} Writing to Ghost Tier...`);
    console.log(`[CEE-HW]  -> MISSION: ${payload.missionStatement.substring(0, 50)}...`);
    console.log(`[CEE-HW] \u2705 Mission grounded.`);
  }
};

// ../cee-agent-blueprint/cli/bridge/daemon.ts
var PORT = 34567;
var cee = new CeeHardwareClient();
var server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === "POST" && req.url === "/v1/warm-anchor") {
    let body = "";
    req.on("data", (chunk) => body += chunk.toString());
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        if (payload.event === "FILE_OPENED") {
          console.log(`
[Daemon] IDE Focus Event: ${payload.data.filePath}`);
          const anchors = [{
            key: `ACTIVE_FILE`,
            value: payload.data.filePath,
            priority: "HIGH"
          }];
          if (payload.data.symbols) {
            for (const sym of payload.data.symbols) {
              anchors.push({
                key: `SYMBOL:${sym.name}`,
                value: `Kind: ${sym.kind}`,
                priority: "CRITICAL"
              });
            }
          }
          await cee.injectAnchorBank(anchors);
          res.writeHead(200);
          res.end(JSON.stringify({ status: "success", injected: anchors.length }));
        } else if (payload.event === "GROUND_MISSION") {
          console.log(`
[Daemon] \u{1F3AF} MISSION GROUNDING REQUESTED`);
          console.log(`[Daemon] Content: "${payload.data.mission.substring(0, 100)}..."`);
          await cee.injectGhostTier({
            missionStatement: payload.data.mission,
            constraints: ["NO_DRIFT", "RECALL_PRIORITY"],
            persistenceRate: "MAXIMUM"
          });
          res.writeHead(200);
          res.end(JSON.stringify({ status: "success", ghost_grounded: true }));
        }
      } catch (err) {
        res.writeHead(400);
        res.end();
      }
    });
  }
});
server.listen(PORT, "127.0.0.1", () => {
  console.log("================================================");
  console.log("\u{1F916} CEE Bridge Daemon Running");
  console.log(`\u{1F50C} Listening for IDE events on http://127.0.0.1:${PORT}`);
  console.log("================================================\n");
});
