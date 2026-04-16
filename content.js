let isHidden = true; // By default, hide them unless stated otherwise by storage.

function hideAnswers() {
    if (!isHidden) return;

    const options = document.querySelectorAll('.AccessibilityWrapper');
    options.forEach(opt => {
        if (opt.classList.contains('--correct')) {
            opt.classList.remove('--correct');
            opt.classList.add('apc-was-dash-correct');
        } else if (opt.classList.contains('mcq-option--correct')) {
            opt.classList.remove('mcq-option--correct');
            opt.classList.add('mcq-option', 'apc-was-mcq-correct');
        }

        if (opt.classList.contains('--incorrect')) {
            opt.classList.remove('--incorrect');
            opt.classList.add('apc-was-dash-incorrect');
        } else if (opt.classList.contains('mcq-option--incorrect')) {
            opt.classList.remove('mcq-option--incorrect');
            opt.classList.add('mcq-option', 'apc-was-mcq-incorrect');
        }
    });

    // 2. Hide LearnosityDistractor
    const distractors = document.querySelectorAll('.LearnosityDistractor');
    distractors.forEach(el => {
        if (el.style.display !== 'none') {
            el.dataset.oldDisplay = el.style.display || '';
            el.style.display = 'none';
            el.classList.add('apc-hidden-element');
        }
    });

    // 3. Hide response-analysis-wrapper
    const responses = document.querySelectorAll('.response-analysis-wrapper');
    responses.forEach(el => {
        if (el.style.display !== 'none') {
            el.dataset.oldDisplay = el.style.display || '';
            el.style.display = 'none';
            el.classList.add('apc-hidden-element');
        }
    });

    // 4. Hide performance_icon
    const icons = document.querySelectorAll('.performance_icon');
    icons.forEach(el => {
        if (el.style.display !== 'none') {
            el.dataset.oldDisplay = el.style.display || '';
            el.style.display = 'none';
            el.classList.add('apc-hidden-element');
        }
    });

    // 5. Remove --chosen from everywhere
    const dashChosen = document.querySelectorAll('.\\-\\-chosen');
    dashChosen.forEach(el => {
        el.classList.remove('--chosen');
        el.classList.add('apc-was-dash-chosen');
    });

    const bemChosen = document.querySelectorAll('[class*="--chosen"]');
    bemChosen.forEach(el => {
        Array.from(el.classList).forEach(cls => {
            if (cls.includes('--chosen') && cls !== '--chosen' && !cls.startsWith('apc-')) {
                el.classList.remove(cls);
                el.classList.add('apc-was-suffix-chosen');
                el.dataset.apcChosenClass = cls;
            }
        });
    });
}

function restoreAnswers() {
    // 1. Restore --correct and --incorrect
    const options = document.querySelectorAll('.AccessibilityWrapper');
    options.forEach(opt => {
        if (opt.classList.contains('apc-was-dash-correct')) {
            opt.classList.remove('apc-was-dash-correct');
            opt.classList.add('--correct');
        }
        if (opt.classList.contains('apc-was-mcq-correct')) {
            opt.classList.remove('apc-was-mcq-correct');
            opt.classList.add('mcq-option--correct');
        }

        if (opt.classList.contains('apc-was-dash-incorrect')) {
            opt.classList.remove('apc-was-dash-incorrect');
            opt.classList.add('--incorrect');
        }
        if (opt.classList.contains('apc-was-mcq-incorrect')) {
            opt.classList.remove('apc-was-mcq-incorrect');
            opt.classList.add('mcq-option--incorrect');
        }
    });

    // 2, 3, 4. Restore hidden elements directly tracked
    const hiddenEls = document.querySelectorAll('.apc-hidden-element');
    hiddenEls.forEach(el => {
        el.style.display = el.dataset.oldDisplay || '';
        el.classList.remove('apc-hidden-element');
    });

    // 5. Restore --chosen classes
    const dashChosenEls = document.querySelectorAll('.apc-was-dash-chosen');
    dashChosenEls.forEach(el => {
        el.classList.remove('apc-was-dash-chosen');
        el.classList.add('--chosen');
    });

    const suffixChosenEls = document.querySelectorAll('.apc-was-suffix-chosen');
    suffixChosenEls.forEach(el => {
        el.classList.remove('apc-was-suffix-chosen');
        if (el.dataset.apcChosenClass) {
            el.classList.add(el.dataset.apcChosenClass);
        }
    });
}

const observer = new MutationObserver((mutations) => {
    const otElements = ['ot-sdk-btn-floating', 'onetrust-banner-sdk', 'onetrust-pc-sdk'];
    otElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    if (isHidden) {
        let shouldCheck = false;
        for (const mut of mutations) {
            if (mut.addedNodes.length > 0 || mut.attributeName === 'class') {
                shouldCheck = true;
                break;
            }
        }
        if (shouldCheck) hideAnswers();
    }
});

// Start observing the page
if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    });
}

// Receive messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
        isHidden = request.state;
        if (isHidden) {
            hideAnswers();
        } else {
            restoreAnswers();
        }
        sendResponse({ status: "success" });
    } else if (request.action === "getState") {
        sendResponse({ state: isHidden });
    }
    return true;
});

// Initialization
chrome.storage.local.get(['isHidden'], function (result) {
    if (result.isHidden !== undefined) {
        isHidden = result.isHidden;
    } else {
        // Default behavior: keep answers hidden
        isHidden = true;
    }

    if (isHidden) {
        hideAnswers();
        // Just in case it renders before our script fires fully
        setInterval(() => { if (isHidden) hideAnswers(); }, 2000);
    }
});
