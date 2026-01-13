document.addEventListener('DOMContentLoaded', () => {
    // --- Global Elements ---
    const folderInput = document.getElementById('folder-path');
    const verifyBtn = document.getElementById('check-folder-btn');
    const folderStatus = document.getElementById('folder-status');

    // Tab Elements
    const tabsHeader = document.getElementById('tabs-header');
    const tabsContent = document.getElementById('tabs-content');
    const emptyState = document.getElementById('empty-state');
    const sessionTemplate = document.getElementById('session-template');

    // Dialog Elements (Shared)
    const runDialog = document.getElementById('run-dialog');
    const dynamicInputs = document.getElementById('dynamic-inputs');
    const executeBtn = document.getElementById('execute-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    // Browser Elements
    const browseBtn = document.getElementById('browse-btn');
    const browserDialog = document.getElementById('browser-dialog');
    const browserList = document.getElementById('browser-list');
    const browserCurrentPath = document.getElementById('browser-current-path');
    const browserUpBtn = document.getElementById('browser-up-btn');
    const browserSelectBtn = document.getElementById('browser-select-btn');

    // --- State Management ---
    const sessions = {}; // key: tabId, value: { path, params, logFile, intervalId, elements: {} }
    let activeTabId = null;
    let targetSessionId = null; // For dialog context

    // --- Functions ---

    function createSession(path, data) {
        // Generate unique ID
        const tabId = 'tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // --- 1. Create Tab Button ---
        const tabBtn = document.createElement('div');
        tabBtn.className = 'tab-btn';
        const folderName = path.split('/').pop() || path;
        tabBtn.innerHTML = `
            <span>${folderName}</span>
            <span class="tab-close" data-id="${tabId}">&times;</span>
        `;
        tabBtn.dataset.id = tabId;
        tabBtn.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-close')) {
                closeSession(tabId);
            } else {
                switchTab(tabId);
            }
        });
        tabsHeader.appendChild(tabBtn);

        // --- 2. Create Panel Content ---
        const fragment = sessionTemplate.content.cloneNode(true);
        const panel = fragment.querySelector('.session-panel');
        panel.id = `panel-${tabId}`;

        // Populate static info
        panel.querySelector('.path-badge').textContent = path;

        // Setup references
        const elements = {
            panel: panel,
            runBtn: panel.querySelector('.open-dialog-btn'),
            logSection: panel.querySelector('.log-monitor'),
            logContainer: panel.querySelector('.log-container'),
            logContent: panel.querySelector('.log-content'),
            statusBadge: panel.querySelector('.connection-status')
        };

        // Event Listener for Run
        elements.runBtn.addEventListener('click', () => {
            openRunDialog(tabId);
        });

        tabsContent.appendChild(panel);

        // --- 3. Store Session State ---
        sessions[tabId] = {
            id: tabId,
            path: path,
            params: data.params || [],
            logFile: data.logFile || 'output.log',
            intervalId: null,
            elements: elements
        };

        // --- 4. Switch to new tab ---
        switchTab(tabId);
        emptyState.classList.add('hidden');
    }

    function switchTab(tabId) {
        activeTabId = tabId;

        // Update Buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.id === tabId) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Update Panels
        document.querySelectorAll('.session-panel').forEach(panel => {
            if (panel.id === `panel-${tabId}`) panel.classList.remove('hidden');
            else panel.classList.add('hidden');
        });
    }

    function closeSession(tabId) {
        // Cleanup interval
        if (sessions[tabId].intervalId) {
            clearInterval(sessions[tabId].intervalId);
        }

        // Remove DOM
        const tabBtn = document.querySelector(`.tab-btn[data-id="${tabId}"]`);
        if (tabBtn) tabBtn.remove();

        const panel = document.getElementById(`panel-${tabId}`);
        if (panel) panel.remove();

        delete sessions[tabId];

        // Switch to another tab if active was closed
        if (activeTabId === tabId) {
            const remainingKeys = Object.keys(sessions);
            if (remainingKeys.length > 0) {
                switchTab(remainingKeys[remainingKeys.length - 1]);
            } else {
                activeTabId = null;
                emptyState.classList.remove('hidden');
            }
        }
    }

    function openRunDialog(sessionId) {
        targetSessionId = sessionId;
        const session = sessions[sessionId];
        if (!session) return;

        dynamicInputs.innerHTML = '';

        session.params.forEach(param => {
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
                input = document.createElement('select');
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

        if (session.params.length === 0) {
            const msg = document.createElement('p');
            msg.textContent = '引数は不要です。';
            msg.style.color = '#94a3b8';
            dynamicInputs.appendChild(msg);
        }

        runDialog.classList.remove('hidden');
    }

    // --- Global Event Listeners ---

    // Verify / Open Tab
    verifyBtn.addEventListener('click', async () => {
        const path = folderInput.value.trim();
        if (!path) return;

        folderStatus.textContent = 'スキャン中...';
        folderStatus.className = 'status-text';

        try {
            const res = await fetch(`api.php?action=scan&path=${encodeURIComponent(path)}`);
            const data = await res.json();

            if (data.found) {
                folderStatus.textContent = '✓ 有効なプロジェクトが見つかりました';
                folderStatus.className = 'status-text success';

                createSession(path, data);

            } else {
                folderStatus.textContent = '❌ ディレクトリ内に webrunner.sh が見つかりません';
                folderStatus.className = 'status-text error';
            }
        } catch (e) {
            folderStatus.textContent = '❌ サーバー接続エラー';
            folderStatus.className = 'status-text error';
            console.error(e);
        }
    });

    // Run Execution (Global Dialog)
    executeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!targetSessionId || !sessions[targetSessionId]) return;

        const session = sessions[targetSessionId];
        const inputs = document.querySelectorAll('.param-input');
        const args = {};

        inputs.forEach(input => {
            args[input.dataset.var] = input.value;
        });

        runDialog.classList.add('hidden');

        // Update Session UI
        const els = session.elements;
        els.logSection.classList.remove('hidden');
        els.logContent.textContent = '';
        els.statusBadge.textContent = '実行要求中...';
        els.statusBadge.className = 'connection-status badge';

        try {
            // Start process
            await fetch(`api.php?action=run&path=${encodeURIComponent(session.path)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    args: args,
                    logFile: session.logFile
                })
            });

            els.statusBadge.textContent = 'ログ受信開始...';
            startPolling(session);

        } catch (e) {
            alert('実行開始に失敗しました: ' + e.message);
        }
    });

    // Close Dialogs
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            runDialog.classList.add('hidden');
            browserDialog.classList.add('hidden');
        });
    });

    // Polling Logic
    function startPolling(session) {
        if (session.intervalId) clearInterval(session.intervalId);

        let currentOffset = 0;
        const els = session.elements;

        const pollFn = async () => {
            try {
                const logRes = await fetch(`read_log.php?path=${encodeURIComponent(session.path)}&file=${encodeURIComponent(session.logFile)}&offset=${currentOffset}`);
                const logData = await logRes.json();

                // If session was closed during fetch
                if (!sessions[session.id]) return;

                if (logData.error) {
                    els.statusBadge.textContent = 'ログ読み込みエラー';
                    els.statusBadge.style.background = '#ef4444';
                    return;
                }

                if (logData.content) {
                    els.logContent.textContent += logData.content;
                    currentOffset = logData.offset;

                    els.logContainer.scrollTop = els.logContainer.scrollHeight;

                    if (logData.content.includes('SUCCESS')) {
                        els.statusBadge.textContent = '完了 (成功)';
                        els.statusBadge.style.background = '#22c55e';
                        stopPolling(session);
                        sendNotification('バッチ処理完了', `${session.path} が終了しました。`, 'success');
                    } else if (logData.content.includes('FAILURE') || logData.content.includes('ERROR')) {
                        els.statusBadge.textContent = '失敗';
                        els.statusBadge.style.background = '#ef4444';
                        stopPolling(session);
                        sendNotification('バッチ処理失敗', `${session.path} でエラーが発生しました。`, 'error');
                    }
                }

                // Heartbeat
                const txt = els.statusBadge.textContent;
                if (txt.startsWith('実行中')) {
                    els.statusBadge.textContent = txt.includes('.') ? '実行中' : '実行中 .';
                } else if (!txt.includes('完了') && !txt.includes('失敗')) {
                    els.statusBadge.textContent = '実行中';
                    els.statusBadge.style.background = '#22c55e';
                    els.statusBadge.style.color = '#000';
                }

            } catch (e) {
                console.error('Poll error', e);
            }
        };

        session.intervalId = setInterval(pollFn, 1000);
        pollFn(); // Initial
    }

    function stopPolling(session) {
        if (session.intervalId) {
            clearInterval(session.intervalId);
            session.intervalId = null;
        }
    }

    // --- File Browser Logic (Re-integrated) ---
    // ... Copying previous browser logic ...

    let browserPath = '';
    let lastBrowserData = null;

    browseBtn.addEventListener('click', () => {
        const currentVal = folderInput.value.trim();
        browserPath = currentVal || '/';
        loadDirectory(browserPath);
        browserDialog.classList.remove('hidden');
    });

    browserUpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (lastBrowserData && lastBrowserData.parent) {
            loadDirectory(lastBrowserData.parent);
        }
    });

    browserSelectBtn.addEventListener('click', (e) => {
        e.preventDefault();
        folderInput.value = browserCurrentPath.value;
        browserDialog.classList.add('hidden');
        verifyBtn.click();
    });

    async function loadDirectory(path) {
        browserList.innerHTML = '<div style="padding:1rem; color:#94a3b8">読み込み中...</div>';
        try {
            const res = await fetch(`api.php?action=list&path=${encodeURIComponent(path)}`);
            const data = await res.json();
            lastBrowserData = data;

            browserCurrentPath.value = data.current;
            browserList.innerHTML = '';

            if (data.items.length === 0) {
                browserList.innerHTML = '<div style="padding:1rem; color:#94a3b8">空のディレクトリ</div>';
                return;
            }

            data.items.sort((a, b) => { // Sort runner first
                if (a.hasRunner && !b.hasRunner) return -1;
                if (!a.hasRunner && b.hasRunner) return 1;
                return a.name.localeCompare(b.name);
            });

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
            browserList.innerHTML = '<div style="padding:1rem; color:#ef4444">ディレクトリ読み込みエラー</div>';
        }
    }

    // Helper for Notifications
    function sendNotification(title, body, type) {
        if (!("Notification" in window)) return;
        if (Notification.permission === "granted") {
            new Notification(title, { body: body });
        }
    }
    if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
});
