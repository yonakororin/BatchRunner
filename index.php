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
                    <label for="folder-path">Top Directory</label>
                    <div class="input-wrapper">
                        <input type="text" id="folder-path" placeholder="/path/to/project" value="/mnt/c/Projects/BatchRunner/demo">
                        <button id="browse-btn" class="btn secondary">
                            <span class="icon">📂</span> Browse
                        </button>
                        <button id="check-folder-btn" class="btn primary">
                            <span class="icon">➕</span> Open Tab
                        </button>
                    </div>
                    <p id="folder-status" class="status-text"></p>
                </div>
            </section>

            <!-- Tabs Header -->
            <div id="tabs-header" class="tabs-header">
                <!-- Tab buttons injected here -->
            </div>

            <!-- Tabs Content -->
            <div id="tabs-content" class="tabs-content">
                <!-- Session panels injected here -->
                <div id="empty-state" class="glass-panel" style="text-align:center; color:#94a3b8; padding: 3rem;">
                    Select a folder and click "Open Tab" to start.
                </div>
            </div>
        </main>
    </div>

    <!-- Template for Session Panel -->
    <template id="session-template">
        <div class="session-panel hidden">
            <section class="runner-section glass-panel">
                <div class="runner-header">
                    <h2>Available Scripts</h2>
                    <span class="path-badge"></span>
                </div>
                <div class="script-card">
                    <div class="script-info">
                        <h3>webrunner.sh</h3>
                        <p>Main execution entry point.</p>
                    </div>
                    <button class="open-dialog-btn btn accent">
                        Run Script
                    </button>
                </div>
            </section>

            <section class="log-monitor glass-panel hidden">
                <div class="log-header">
                    <h3>Execution Logs</h3>
                    <div class="log-controls">
                        <span class="connection-status badge">Disconnected</span>
                    </div>
                </div>
                <div class="log-container">
                    <pre class="log-content"></pre>
                </div>
            </section>
        </div>
    </template>

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
