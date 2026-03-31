import * as vscode from 'vscode';
import * as http from 'http';

let statusBarItem: vscode.StatusBarItem;
let anchorCount = 0;

/**
 * CEE Agent IDE Bridge
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('🔌 CEE IDE Bridge is now active.');

    // 1. Create Status Bar Item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'cee.showStatus';
    updateStatusBar(0);
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 2. Watch for file opens
    const editorWatcher = vscode.window.onDidChangeActiveTextEditor(async editor => {
        if (!editor) return;
        const document = editor.document;
        if (document.uri.scheme !== 'file') return;

        const filePath = document.uri.fsPath;
        
        let symbols: any[] = [];
        try {
            const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );
            
            if (documentSymbols) {
                symbols = documentSymbols.map(sym => ({
                    name: sym.name,
                    kind: vscode.SymbolKind[sym.kind]
                }));
            }
        } catch (e) {}

        sendToDaemon({
            event: 'FILE_OPENED',
            data: { filePath, symbols }
        });
    });

    // 3. Command: Ground Mission (Ghost Tier)
    const groundMissionCmd = vscode.commands.registerCommand('cee.groundMission', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text || text.length < 10) {
            vscode.window.showWarningMessage('Please select a detailed plan/mission statement first.');
            return;
        }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Grounding Mission in CEE Ghost Tier...",
            cancellable: false
        }, async (progress) => {
            await sendToDaemon({
                event: 'GROUND_MISSION',
                data: { mission: text }
            });
            vscode.window.showInformationMessage('✅ Mission physically pinned in Hardware Ghost Tier.');
        });
    });

    context.subscriptions.push(editorWatcher, groundMissionCmd);
}

function updateStatusBar(count: number) {
    anchorCount += count;
    statusBarItem.text = `$(circuit-board) CEE Anchors: ${anchorCount}`;
    statusBarItem.tooltip = `ShiftCore CEE Hardware: ${anchorCount} symbols currently in Anchor Bank (HBM)`;
}

function sendToDaemon(payload: any) {
    const postData = JSON.stringify(payload);
    
    const options = {
        hostname: '127.0.0.1',
        port: 34567,
        path: '/v1/warm-anchor',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const response = JSON.parse(body);
                if (payload.event === 'FILE_OPENED' && response.injected) {
                    updateStatusBar(response.injected);
                }
            });
        }
    });

    req.on('error', () => {});
    req.write(postData);
    req.end();
}

export function deactivate() {}
