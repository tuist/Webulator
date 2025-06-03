const vscode = require('vscode');
const express = require('express');
const cors = require('cors');
const path = require('path');

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
                    localResourceRoots: []
                }
            );

            webviewPanel.webview.html = getWebviewContent();
            
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

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Webulator</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                margin: 0;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            h1 {
                color: var(--vscode-foreground);
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 10px;
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 10px 20px;
                margin: 5px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 14px;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            .response-container {
                margin-top: 20px;
                padding: 15px;
                background-color: var(--vscode-textCodeBlock-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 5px;
                font-family: 'Courier New', monospace;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
            .input-group {
                margin: 20px 0;
            }
            input[type="text"] {
                background-color: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border: 1px solid var(--vscode-input-border);
                padding: 8px;
                width: 300px;
                margin-right: 10px;
            }
            .status {
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 10px;
            }
            .status.online {
                background-color: #4CAF50;
            }
            .status.offline {
                background-color: #f44336;
            }
            .header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <span class="status" id="status"></span>
                <h1>Webulator Control Panel</h1>
            </div>
            
            <p>This is a demonstration of VSCode extension communicating with an HTTP server.</p>
            
            <div>
                <button onclick="fetchHello()">Say Hello</button>
                <button onclick="fetchStatus()">Get Status</button>
                <button onclick="clearResponse()">Clear</button>
            </div>
            
            <div class="input-group">
                <input type="text" id="echoInput" placeholder="Enter message to echo...">
                <button onclick="sendEcho()">Send Echo</button>
            </div>
            
            <div class="response-container" id="response">
                Click a button to see the response from the HTTP server...
            </div>
        </div>

        <script>
            const SERVER_URL = 'http://localhost:3000';
            
            async function makeRequest(endpoint, options = {}) {
                try {
                    updateStatus('online');
                    const response = await fetch(SERVER_URL + endpoint, {
                        ...options,
                        headers: {
                            'Content-Type': 'application/json',
                            ...options.headers
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(\`HTTP error! status: \${response.status}\`);
                    }
                    
                    const data = await response.json();
                    displayResponse(data);
                } catch (error) {
                    updateStatus('offline');
                    displayResponse({ error: error.message });
                }
            }
            
            function fetchHello() {
                makeRequest('/api/hello');
            }
            
            function fetchStatus() {
                makeRequest('/api/status');
            }
            
            function sendEcho() {
                const input = document.getElementById('echoInput');
                const message = input.value.trim();
                
                if (!message) {
                    displayResponse({ error: 'Please enter a message to echo' });
                    return;
                }
                
                makeRequest('/api/echo', {
                    method: 'POST',
                    body: JSON.stringify({ message: message })
                });
                
                input.value = '';
            }
            
            function displayResponse(data) {
                const responseElement = document.getElementById('response');
                responseElement.textContent = JSON.stringify(data, null, 2);
            }
            
            function clearResponse() {
                document.getElementById('response').textContent = 'Response cleared...';
            }
            
            function updateStatus(status) {
                const statusElement = document.getElementById('status');
                statusElement.className = 'status ' + status;
            }
            
            // Initialize with a hello request
            setTimeout(() => {
                fetchHello();
            }, 1000);
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