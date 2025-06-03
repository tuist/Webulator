const vscode = require('vscode');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

let server = null;
let webviewPanel = null;
const PORT = 3000;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Webulator extension is now active!');

    try {
        // Register the start command
        const startDisposable = vscode.commands.registerCommand('webulator.start', () => {
            startWebulator(context);
        });

        // Register the stop command
        const stopDisposable = vscode.commands.registerCommand('webulator.stop', () => {
            stopWebulator();
        });

        context.subscriptions.push(startDisposable);
        context.subscriptions.push(stopDisposable);
        
        console.log('Webulator commands registered successfully!');
    } catch (error) {
        console.error('Error activating Webulator extension:', error);
        vscode.window.showErrorMessage('Failed to activate Webulator extension: ' + error.message);
    }
}

function startWebulator(context) {
    try {
        // Start the HTTP server if not already running
        if (!server) {
            startHttpServer();
        }

        // Create and show webview panel
        if (webviewPanel) {
            webviewPanel.reveal(vscode.ViewColumn.Beside);
        } else {
            webviewPanel = vscode.window.createWebviewPanel(
                'webulator',
                'Webulator',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(context.extensionPath, '..', 'web'))
                    ]
                }
            );

            webviewPanel.webview.html = getWebviewContent(context, webviewPanel.webview);
            
            // Handle panel disposal
            webviewPanel.onDidDispose(() => {
                webviewPanel = null;
            }, null, context.subscriptions);
        }

        vscode.window.showInformationMessage('Webulator started! Server running on http://localhost:' + PORT);
    } catch (error) {
        console.error('Error starting Webulator:', error);
        vscode.window.showErrorMessage('Failed to start Webulator: ' + error.message);
    }
}

function stopWebulator() {
    try {
        // Close the HTTP server
        if (server) {
            server.close(() => {
                console.log('HTTP server stopped');
            });
            server = null;
        }

        // Close the webview panel
        if (webviewPanel) {
            webviewPanel.dispose();
            webviewPanel = null;
        }

        vscode.window.showInformationMessage('Webulator stopped!');
    } catch (error) {
        console.error('Error stopping Webulator:', error);
        vscode.window.showErrorMessage('Failed to stop Webulator: ' + error.message);
    }
}

function startHttpServer() {
    try {
        const app = express();
        
        // Enable CORS for all routes
        app.use(cors());
        
        // Parse JSON bodies
        app.use(express.json());

        // API endpoints
        app.get('/api/hello', (req, res) => {
            res.json({ 
                message: 'Hello from Webulator!',
                timestamp: new Date().toISOString(),
                port: PORT
            });
        });

        app.get('/api/status', (req, res) => {
            try {
                const packageJson = require('../package.json');
                res.json({
                    status: 'running',
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    version: packageJson.version
                });
            } catch (error) {
                res.json({
                    status: 'running',
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    version: '0.0.1'
                });
            }
        });

        app.post('/api/echo', (req, res) => {
            res.json({
                received: req.body,
                timestamp: new Date().toISOString()
            });
        });

        // Error handling middleware
        app.use((error, req, res, next) => {
            console.error('Server error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });

        // Start the server
        server = app.listen(PORT, () => {
            console.log(`Webulator HTTP server running on http://localhost:${PORT}`);
        });
        
        server.on('error', (error) => {
            console.error('Server error:', error);
            if (error.code === 'EADDRINUSE') {
                vscode.window.showErrorMessage(`Port ${PORT} is already in use. Please stop other processes using this port.`);
            } else {
                vscode.window.showErrorMessage('Server error: ' + error.message);
            }
        });
    } catch (error) {
        console.error('Error starting HTTP server:', error);
        throw error;
    }
}

function getWebviewContent(context, webview) {
    // Read the simulator component
    let simulatorScript = '';
    try {
        const simulatorPath = path.join(context.extensionPath, '..', 'web', 'simulator.js');
        simulatorScript = fs.readFileSync(simulatorPath, 'utf8');
    } catch (error) {
        console.error('Could not load simulator component:', error);
        simulatorScript = '// Simulator component could not be loaded';
    }

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Webulator Simulator</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                height: 100vh;
                overflow: hidden;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .simulator-container {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                height: 100%;
            }
        </style>
    </head>
    <body>
        <div class="simulator-container">
            <webulator-simulator name="iPhone 16" id="deviceSimulator"></webulator-simulator>
        </div>

        <script>
            ${simulatorScript}
        </script>

        <script>
            // Wait for the simulator to load, then load default content
            setTimeout(() => {
                const simulator = document.getElementById('deviceSimulator');
                if (simulator) {
                    // Load a simple example page
                    simulator.navigate('https://httpbin.org/html');
                }
            }, 2000);
        </script>
    </body>
    </html>`;
}

function deactivate() {
    stopWebulator();
}

module.exports = {
    activate,
    deactivate
};