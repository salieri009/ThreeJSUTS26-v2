const overlayBtns = document.querySelectorAll('.overlay-btn');
const itemPanel = document.getElementById('item-panel');
const panelHeader = itemPanel.querySelector('.overlay-item-panel-header');
const itemLists = itemPanel.querySelectorAll('.item-list');
const statusMessage = document.getElementById('status-message'); // Ensure this element exists in your HTML

let currentCategory = null;
let statusMessageTimeout; // To store the timeout ID for clearing

export function init() {
    overlayBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;

            // Handle special categories (remove, terrain expansion)
            if (category === 'remove') {
                displayStatusMessage('Deleting...');
                // Add your removal logic here
                toggleOverlayButtonActiveState(btn); // Keep button active/inactive
                return; // Stop further execution for these buttons
            } else if (category === 'terrain expansion') {
                displayStatusMessage('Placing new terrain...');
                // Add your terrain expansion logic here
                toggleOverlayButtonActiveState(btn); // Keep button active/inactive
                return; // Stop further execution for these buttons
            }

            // Normal category button logic
            if (itemPanel.classList.contains('visible') && currentCategory === category) {
                // Clicking an already active category button to close the panel
                itemPanel.classList.remove('visible');
                overlayBtns.forEach(b => b.classList.remove('active'));
                currentCategory = null;
                hideStatusMessage();
            } else {
                // Opening a new category panel
                overlayBtns.forEach(b => b.classList.remove('active')); // Deactivate all
                btn.classList.add('active'); // Activate current
                panelHeader.textContent = btn.textContent;

                itemLists.forEach(list => {
                    list.style.display = (list.dataset.category === category) ? 'flex' : 'none';
                });

                itemPanel.classList.add('visible');
                currentCategory = category;
                hideStatusMessage(); // Hide any lingering status message
            }
        });
    });

    // Close panel when clicking outside
    document.addEventListener('mousedown', e => {
        if (!itemPanel.contains(e.target) && ![...overlayBtns].some(btn => btn.contains(e.target))) {
            itemPanel.classList.remove('visible');
            overlayBtns.forEach(b => b.classList.remove('active'));
            currentCategory = null;
            hideStatusMessage();
        }
    });

    initDrag();
}

/**
 * Toggles the 'active' class on a given button.
 * Useful for 'remove' and 'terrain expansion' buttons that don't open the item panel.
 */
function toggleOverlayButtonActiveState(button) {
    if (button.classList.contains('active')) {
        button.classList.remove('active');
    } else {
        overlayBtns.forEach(b => b.classList.remove('active')); // Deactivate others
        button.classList.add('active'); // Activate this one
    }
}

/**
 * Displays a temporary status message at the bottom of the screen.
 * @param {string} message - The message to display.
 */
function displayStatusMessage(message) {
    clearTimeout(statusMessageTimeout); // Clear any existing timeout
    statusMessage.textContent = message;
    statusMessage.classList.add('visible');

    // Hide the message after 2 seconds
    statusMessageTimeout = setTimeout(() => {
        hideStatusMessage();
    }, 2000);
}

/**
 * Hides the status message.
 */
function hideStatusMessage() {
    statusMessage.classList.remove('visible');
    statusMessage.textContent = ''; // Clear text content
}

function initDrag() {
    let isDragging = false, startX, startY, startLeft, startTop;

    panelHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        itemPanel.classList.add('dragging');
        const rect = itemPanel.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        itemPanel.style.position = 'fixed';
        itemPanel.style.left = `${rect.left}px`;
        itemPanel.style.top = `${rect.top}px`;
        itemPanel.style.bottom = ''; // Clear bottom style for fixed positioning
        itemPanel.style.transform = 'none'; // Clear transform for fixed positioning
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        itemPanel.style.left = `${startLeft + dx}px`;
        itemPanel.style.top = `${startTop + dy}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            itemPanel.classList.remove('dragging');
        }
    });
}