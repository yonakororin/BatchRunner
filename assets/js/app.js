document.addEventListener('DOMContentLoaded', () => {
    const folderInput = document.getElementById('folder-path');
    const verifyBtn = document.getElementById('check-folder-btn');
    const folderStatus = document.getElementById('folder-status');
    const runnerSection = document.getElementById('runner-section');
    const openDialogBtn = document.getElementById('open-dialog-btn');
    const dialog = document.getElementById('run-dialog');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const dynamicInputs = document.getElementById('dynamic-inputs');
    const executeBtn = document.getElementById('execute-btn');
    const logMonitor = document.getElementById('log-monitor');
    const logContent = document.getElementById('log-content');
    const connectionStatus = document.getElementById('connection-status');

    let currentConfig = {
        path: '',
        params: [],
        logFile: 'output.log'
    };
    let eventSource = null;

    // Verify Folder
    verifyBtn.addEventListener('click', async () => {
        const path = folderInput.value.trim();
        if (!path) return;

        folderStatus.textContent = 'Scanning...';
        folderStatus.className = 'status-text';
        runnerSection.classList.add('hidden');

        try {
            const res = await fetch(`api.php?action=scan&path=${encodeURIComponent(path)}`);
            const data = await res.json();

            if (data.found) {
                folderStatus.textContent = '✓ Valid BatchRunner Project found';
                folderStatus.className = 'status-text success';
                runnerSection.classList.remove('hidden');

                currentConfig.path = path;
                currentConfig.params = data.params;
                currentConfig.logFile = data.logFile;
            } else {
                folderStatus.textContent = '❌ No webrunner.sh found in directory';
                folderStatus.className = 'status-text error';
            }
        } catch (e) {
            folderStatus.textContent = '❌ Error connecting to server';
            folderStatus.className = 'status-text error';
            console.error(e);
        }
    });

    // Open Dialog
    openDialogBtn.addEventListener('click', () => {
        dynamicInputs.innerHTML = '';

        currentConfig.params.forEach(param => {
            const group = document.createElement('div');
            group.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = param.label;
            group.appendChild(label);

            let input;
            if (param.type === 'select') {
                input = document.createElement('select');
                if (param.options && Array.isArray(param.options)) {
                    param.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt.trim();
                        option.textContent = opt.trim();
                        input.appendChild(option);
                    });
                }
            } else if (param.type === 'boolean') {
                input = document.createElement('select'); // Simple boolean dropdown
                const optTrue = document.createElement('option');
                optTrue.value = 'true';
                optTrue.textContent = 'True';
                const optFalse = document.createElement('option');
                optFalse.value = 'false';
                optFalse.textContent = 'False';
                input.appendChild(optTrue);
                input.appendChild(optFalse);
            } else if (param.type === 'date') {
                input = document.createElement('input');
                input.type = 'date';
            } else {
                input = document.createElement('input');
                input.type = 'text';
            }

            input.dataset.var = param.var;
            input.className = 'param-input';
            group.appendChild(input);
            dynamicInputs.appendChild(group);
        });

        // If no params, showing a message
        if (currentConfig.params.length === 0) {
            const msg = document.createElement('p');
            msg.textContent = 'No arguments required.';
            msg.style.color = '#94a3b8';
            dynamicInputs.appendChild(msg);
        }

        dialog.classList.remove('hidden');
    });

    // Close Modal
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            dialog.classList.add('hidden');
        });
    });

    // Execute
    executeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const inputs = document.querySelectorAll('.param-input');
        const args = {};

        inputs.forEach(input => {
            args[input.dataset.var] = input.value;
        });

        // Close immediately
        dialog.classList.add('hidden');

        // UI Updates
        logMonitor.classList.remove('hidden');
        logContent.textContent = ''; // Clear logs
        logContent.textContent = ''; // Clear logs
        connectionStatus.textContent = 'Requesting execution...';
        connectionStatus.className = 'badge';

        try {
            // Start process
            await fetch(`api.php?action=run&path=${encodeURIComponent(currentConfig.path)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    args: args,
                    logFile: currentConfig.logFile
                })
            });

            connectionStatus.textContent = 'Starting stream...';

            // Start Polling
            if (eventSource) clearInterval(eventSource); // Reuse var name for interval ID

            let currentOffset = 0;
            const pollFn = async () => {
                try {
                    const logRes = await fetch(`read_log.php?path=${encodeURIComponent(currentConfig.path)}&file=${encodeURIComponent(currentConfig.logFile)}&offset=${currentOffset}`);
                    const logData = await logRes.json();

                    if (logData.error) {
                        connectionStatus.textContent = 'Error reading log';
                        connectionStatus.style.background = '#ef4444';
                        return;
                    }

                    if (logData.content) {
                        logContent.textContent += logData.content;
                        currentOffset = logData.offset;

                        // Auto scroll
                        const container = document.getElementById('log-container');
                        container.scrollTop = container.scrollHeight;

                        // Check for completion
                        if (logData.content.includes('SUCCESS')) {
                            connectionStatus.textContent = 'Completed (Success)';
                            connectionStatus.style.background = '#22c55e';
                            clearInterval(eventSource);
                            sendNotification('Batch Process Completed', 'The script execution finished successfully.', 'success');
                        } else if (logData.content.includes('FAILURE') || logData.content.includes('ERROR')) {
                            connectionStatus.textContent = 'Failed';
                            connectionStatus.style.background = '#ef4444';
                            clearInterval(eventSource);
                            sendNotification('Batch Process Failed', 'Errors were detected during execution.', 'error');
                        }
                    }

                    // Update heartbeat UI visually
                    connectionStatus.textContent = connectionStatus.textContent.includes('Live') ? 'Live .' : 'Live';
                    connectionStatus.style.background = '#22c55e';
                    connectionStatus.style.color = '#000';

                } catch (e) {
                    console.error('Poll error', e);
                }
            };

            // Poll every 1 second
            eventSource = setInterval(pollFn, 1000);

            // Initial poll immediately
            pollFn();

        } catch (e) {
            alert('Failed to start execution: ' + e.message);
        }
    });

    // Helper for Notifications
    function sendNotification(title, body, type) {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification(title, { body: body });
        }
    }

    // Request permission early
    if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    // --- File Browser Logic ---
    const browseBtn = document.getElementById('browse-btn');
    const browserDialog = document.getElementById('browser-dialog');
    const browserList = document.getElementById('browser-list');
    const browserCurrentPath = document.getElementById('browser-current-path');
    const browserUpBtn = document.getElementById('browser-up-btn');
    const browserSelectBtn = document.getElementById('browser-select-btn');
    let browserPath = '';

    browseBtn.addEventListener('click', () => {
        const currentVal = folderInput.value.trim();
        browserPath = currentVal || '/'; // Default start
        loadDirectory(browserPath);
        browserDialog.classList.remove('hidden');
    });

    browserUpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Go to parent handled by API response usually, 
        // but we can just use cached parent or calculate simple string
        // Actually loadDirectory uses API's response for parent, 
        // but here we might request current path's parent.
        // Let's use the 'parent' field from last response if available, or string manipulation.
        // For now, simpler to refetch '..' relative or trust last API response.
        // Let's use API response data stored in a variable if we want robust, 
        // or just rely on API 'list' handling '..' if we passed it? 
        // No, list takes absolute path.
        // Let's use the parent path stored in DOM or var.
        if (lastBrowserData && lastBrowserData.parent) {
            loadDirectory(lastBrowserData.parent);
        }
    });

    browserSelectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        folderInput.value = browserCurrentPath.value;
        browserDialog.classList.add('hidden');
        // Trigger verify automatically
        verifyBtn.click();
    });

    let lastBrowserData = null;

    async function loadDirectory(path) {
        browserList.innerHTML = '<div style="padding:1rem; color:#94a3b8">Loading...</div>';
        try {
            const res = await fetch(`api.php?action=list&path=${encodeURIComponent(path)}`);
            const data = await res.json();
            lastBrowserData = data;

            browserCurrentPath.value = data.current;
            browserList.innerHTML = '';

            if (data.items.length === 0) {
                browserList.innerHTML = '<div style="padding:1rem; color:#94a3b8">Empty directory</div>';
                return;
            }

            data.items.forEach(item => {
                const div = document.createElement('div');
                div.className = `browser-item ${item.hasRunner ? 'has-runner' : ''}`;
                div.innerHTML = `<span class="icon">📁</span> ${item.name}`;
                if (item.hasRunner) {
                    div.innerHTML += ' <span style="margin-left:auto; font-size:0.8rem; color:#22c55e">webrunner.sh</span>';
                }

                div.addEventListener('click', () => {
                    loadDirectory(item.path);
                });

                browserList.appendChild(div);
            });

        } catch (e) {
            console.error(e);
            browserList.innerHTML = '<div style="padding:1rem; color:#ef4444">Error loading directory</div>';
        }
    }
});
