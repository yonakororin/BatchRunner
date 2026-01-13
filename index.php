<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BatchRunner Web Tool</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="app-container">
        <header class="app-header">
            <h1>BatchRunner</h1>
            <p class="subtitle">Advanced Shell Script Orchestration</p>
        </header>

        <main class="main-content">
            <section class="folder-selection glass-panel">
                <div class="input-group">
                    <label for="folder-path">Target Directory</label>
                    <div class="input-wrapper">
                        <input type="text" id="folder-path" placeholder="/path/to/project" value="/mnt/c/Projects/BatchRunner/demo">
                        <button id="browse-btn" class="btn secondary">
                            <span class="icon">📂</span> Browse
                        </button>
                        <button id="check-folder-btn" class="btn primary">
                            <span class="icon">🔍</span> Verify
                        </button>
                    </div>
                    <p id="folder-status" class="status-text"></p>
                </div>
            </section>

            <section id="runner-section" class="runner-section glass-panel hidden">
                <div class="runner-header">
                    <h2>Available Scripts</h2>
                </div>
                <div class="script-card">
                    <div class="script-info">
                        <h3>webrunner.sh</h3>
                        <p>Main execution entry point.</p>
                    </div>
                    <button id="open-dialog-btn" class="btn accent">
                        Run Script
                    </button>
                </div>
            </section>

            <section id="log-monitor" class="log-monitor glass-panel hidden">
                <div class="log-header">
                    <h3>Execution Logs</h3>
                    <div class="log-controls">
                        <span id="connection-status" class="badge">Disconnected</span>
                    </div>
                </div>
                <div id="log-container" class="log-container">
                    <pre id="log-content"></pre>
                </div>
            </section>
        </main>
    </div>

    <!-- File Browser Modal -->
    <div id="browser-dialog" class="modal-overlay hidden">
        <div class="modal glass-panel browser-modal">
            <div class="modal-header">
                <h2>Select Folder</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="browser-nav">
                    <button id="browser-up-btn" class="btn secondary sm">⬆ Up</button>
                    <input type="text" id="browser-current-path" readonly>
                </div>
                <div id="browser-list" class="browser-list">
                    <!-- Items injected here -->
                </div>
            </div>
            <div class="modal-footer">
                <button class="close-modal btn secondary">Cancel</button>
                <button id="browser-select-btn" class="btn primary">Select This Folder</button>
            </div>
        </div>
    </div>

    <!-- Run Dialog -->
    <div id="run-dialog" class="modal-overlay hidden">
        <div class="modal glass-panel">
            <div class="modal-header">
                <h2>Configure Execution</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="run-form">
                    <div id="dynamic-inputs">
                        <!-- Inputs injected here -->
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="close-modal btn secondary">Cancel</button>
                <button id="execute-btn" class="btn primary">Launch</button>
            </div>
        </div>
    </div>

    <script src="assets/js/app.js"></script>
</body>
</html>
