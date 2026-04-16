document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const statusLabel = document.getElementById('statusLabel');
    const errorMsg = document.getElementById('errorMsg');
    
    // Check if user is on collegeboard.org
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs || tabs.length === 0) return;

        const currentUrl = tabs[0].url || '';
        if (!currentUrl.includes('collegeboard.org')) {
            toggleSwitch.disabled = true;
            statusLabel.textContent = 'Unavailable';
            statusLabel.style.color = 'var(--text-muted)';
            errorMsg.style.display = 'block';
            return;
        }
        
        // Try getting state from the content script
        chrome.tabs.sendMessage(tabs[0].id, {action: "getState"}, (response) => {
            let isHidden = true; // Default to true if not found

            if (chrome.runtime.lastError) {
                // If content script hasn't loaded yet on the page, rely on storage
                chrome.storage.local.get(['isHidden'], (res) => {
                    if (res.isHidden !== undefined) {
                        isHidden = res.isHidden;
                    }
                    updateUI(isHidden);
                    errorMsg.textContent = 'Refresh page if toggle fails.';
                    errorMsg.style.display = 'block';
                    errorMsg.style.color = 'var(--text-muted)';
                    setupSwitchListener(tabs[0].id, isHidden);
                });
                return;
            }
            
            if (response && response.state !== undefined) {
                isHidden = response.state;
            }
            updateUI(isHidden);
            setupSwitchListener(tabs[0].id, isHidden);
        });
    });
    
    function setupSwitchListener(tabId, hideState) {
        toggleSwitch.disabled = false;
        
        // Clone to remove existing listeners cleanly
        const newSwitch = toggleSwitch.cloneNode(true);
        toggleSwitch.parentNode.replaceChild(newSwitch, toggleSwitch);

        let currentHidden = hideState;
        newSwitch.checked = currentHidden;

        newSwitch.addEventListener('change', (e) => {
            currentHidden = e.target.checked;
            chrome.storage.local.set({isHidden: currentHidden});
            updateUINode(currentHidden);
            
            chrome.tabs.sendMessage(tabId, {action: "toggle", state: currentHidden}, (resp) => {
                if (chrome.runtime.lastError) {
                    errorMsg.textContent = 'Please refresh the page to sync state.';
                    errorMsg.style.display = 'block';
                } else {
                    errorMsg.style.display = 'none';
                }
            });
        });
    }

    function updateUI(hidden) {
        const sw = document.getElementById('toggleSwitch');
        if(sw) sw.checked = hidden;
        updateUINode(hidden);
    }

    function updateUINode(hidden) {
        const label = document.getElementById('statusLabel');
        if (hidden) {
            label.textContent = "Active";
            label.style.color = "var(--success)";
        } else {
            label.textContent = "Inactive";
            label.style.color = "var(--danger)";
        }
    }
});
