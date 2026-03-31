import * as http from 'http';
import { CeeHardwareClient, AnchorPayload } from '../../sdk/cee-client';

const PORT = 34567;
const cee = new CeeHardwareClient();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/v1/warm-anchor') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        
        if (payload.event === 'FILE_OPENED') {
          console.log(`\n[Daemon] IDE Focus Event: ${payload.data.filePath}`);
          const anchors: AnchorPayload[] = [{
            key: `ACTIVE_FILE`,
            value: payload.data.filePath,
            priority: 'HIGH'
          }];
          
          if (payload.data.symbols) {
            for (const sym of payload.data.symbols) {
              anchors.push({
                key: `SYMBOL:${sym.name}`,
                value: `Kind: ${sym.kind}`,
                priority: 'CRITICAL'
              });
            }
          }
          await cee.injectAnchorBank(anchors);
          res.writeHead(200);
          res.end(JSON.stringify({ status: 'success', injected: anchors.length }));
        } 
        
        else if (payload.event === 'GROUND_MISSION') {
          console.log(`\n[Daemon] 🎯 MISSION GROUNDING REQUESTED`);
          console.log(`[Daemon] Content: "${payload.data.mission.substring(0, 100)}..."`);
          
          await cee.injectGhostTier({
            missionStatement: payload.data.mission,
            constraints: ["NO_DRIFT", "RECALL_PRIORITY"],
            persistenceRate: 'MAXIMUM'
          });
          
          res.writeHead(200);
          res.end(JSON.stringify({ status: 'success', ghost_grounded: true }));
        }

      } catch (err) {
        res.writeHead(400);
        res.end();
      }
    });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('================================================');
  console.log('🤖 CEE Bridge Daemon Running');
  console.log(`🔌 Listening for IDE events on http://127.0.0.1:${PORT}`);
  console.log('================================================\n');
});
