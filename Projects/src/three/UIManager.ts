// @ts-nocheck
/**
 * =============================================
 * UIManager Class - UI 상호작용 관리
 * =============================================
 * 오버레이 버튼, 아이템 패널, 드래그 기능
 */

export class UIManager {
    private overlayBtns: NodeListOf<Element> | null = null;
    private itemPanel: HTMLElement | null = null;
    private panelHeader: Element | null = null;
    private itemLists: NodeListOf<Element> | null = null;
    private statusMessage: HTMLElement | null = null;
    private currentCategory: string | null = null;
    private statusMessageTimeout: ReturnType<typeof setTimeout> | null = null;

    // Drag state
    private isDragging = false;
    private startX = 0;
    private startY = 0;
    private startLeft = 0;
    private startTop = 0;

    /**
     * UI 초기화
     */
    init(): void {
        this.overlayBtns = document.querySelectorAll('.overlay-btn');
        this.itemPanel = document.getElementById('item-panel');
        
        if (this.itemPanel) {
            this.panelHeader = this.itemPanel.querySelector('.overlay-item-panel-header');
            this.itemLists = this.itemPanel.querySelectorAll('.item-list');
        }
        this.statusMessage = document.getElementById('status-message');

        if (this.overlayBtns) {
            this.overlayBtns.forEach(btn => {
                btn.addEventListener('click', () => this.handleButtonClick(btn));
            });
        }

        // Close panel when clicking outside
        document.addEventListener('mousedown', this.handleOutsideClick);

        this.initDrag();
    }

    /**
     * 버튼 클릭 핸들러
     */
    private handleButtonClick(btn: Element): void {
        const category = (btn as HTMLElement).dataset.category;

        // Handle special categories (remove, terrain expansion)
        if (category === 'remove') {
            this.displayStatusMessage('Deleting...');
            this.toggleOverlayButtonActiveState(btn);
            return;
        } else if (category === 'terrain expansion') {
            this.displayStatusMessage('Placing new terrain...');
            this.toggleOverlayButtonActiveState(btn);
            return;
        }

        // Normal category button logic
        if (this.itemPanel?.classList.contains('visible') && this.currentCategory === category) {
            // Clicking an already active category button to close the panel
            this.itemPanel.classList.remove('visible');
            this.overlayBtns?.forEach(b => b.classList.remove('active'));
            this.currentCategory = null;
            this.hideStatusMessage();
        } else {
            // Opening a new category panel
            this.overlayBtns?.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (this.panelHeader) {
                this.panelHeader.textContent = btn.textContent;
            }

            this.itemLists?.forEach(list => {
                (list as HTMLElement).style.display = 
                    (list as HTMLElement).dataset.category === category ? 'flex' : 'none';
            });

            this.itemPanel?.classList.add('visible');
            this.currentCategory = category || null;
            this.hideStatusMessage();
        }
    }

    /**
     * 외부 클릭 핸들러 (패널 닫기)
     */
    private handleOutsideClick = (e: MouseEvent): void => {
        const target = e.target as Node;
        
        if (this.itemPanel && 
            !this.itemPanel.contains(target) && 
            this.overlayBtns && 
            ![...this.overlayBtns].some(btn => btn.contains(target))) {
            
            this.itemPanel.classList.remove('visible');
            this.overlayBtns.forEach(b => b.classList.remove('active'));
            this.currentCategory = null;
            this.hideStatusMessage();
        }
    };

    /**
     * 버튼 활성 상태 토글
     */
    private toggleOverlayButtonActiveState(button: Element): void {
        if (button.classList.contains('active')) {
            button.classList.remove('active');
        } else {
            this.overlayBtns?.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        }
    }

    /**
     * 상태 메시지 표시
     */
    displayStatusMessage(message: string): void {
        if (this.statusMessageTimeout) {
            clearTimeout(this.statusMessageTimeout);
        }
        
        if (this.statusMessage) {
            this.statusMessage.textContent = message;
            this.statusMessage.classList.add('visible');
        }

        this.statusMessageTimeout = setTimeout(() => {
            this.hideStatusMessage();
        }, 2000);
    }

    /**
     * 상태 메시지 숨기기
     */
    hideStatusMessage(): void {
        if (this.statusMessage) {
            this.statusMessage.classList.remove('visible');
            this.statusMessage.textContent = '';
        }
    }

    /**
     * 드래그 기능 초기화
     */
    private initDrag(): void {
        if (this.panelHeader) {
            this.panelHeader.addEventListener('mousedown', this.handleDragStart);
        }

        document.addEventListener('mousemove', this.handleDragMove);
        document.addEventListener('mouseup', this.handleDragEnd);
    }

    private handleDragStart = (e: Event): void => {
        const event = e as MouseEvent;
        this.isDragging = true;
        this.itemPanel?.classList.add('dragging');
        
        const rect = this.itemPanel?.getBoundingClientRect();
        if (rect) {
            this.startX = event.clientX;
            this.startY = event.clientY;
            this.startLeft = rect.left;
            this.startTop = rect.top;
            
            if (this.itemPanel) {
                this.itemPanel.style.position = 'fixed';
                this.itemPanel.style.left = `${rect.left}px`;
                this.itemPanel.style.top = `${rect.top}px`;
                this.itemPanel.style.bottom = '';
                this.itemPanel.style.transform = 'none';
            }
        }
    };

    private handleDragMove = (e: MouseEvent): void => {
        if (!this.isDragging || !this.itemPanel) return;
        
        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        this.itemPanel.style.left = `${this.startLeft + dx}px`;
        this.itemPanel.style.top = `${this.startTop + dy}px`;
    };

    private handleDragEnd = (): void => {
        if (this.isDragging) {
            this.isDragging = false;
            this.itemPanel?.classList.remove('dragging');
        }
    };

    /**
     * 정리
     */
    dispose(): void {
        document.removeEventListener('mousedown', this.handleOutsideClick);
        document.removeEventListener('mousemove', this.handleDragMove);
        document.removeEventListener('mouseup', this.handleDragEnd);
        
        if (this.statusMessageTimeout) {
            clearTimeout(this.statusMessageTimeout);
        }
        
        console.log('[UIManager] Disposed');
    }
}

// ═══════════════════════════════════════════════════════════════
// Singleton Instance
// ═══════════════════════════════════════════════════════════════
export const uiManager = new UIManager();

// ═══════════════════════════════════════════════════════════════
// Legacy Exports (호환성 유지)
// ═══════════════════════════════════════════════════════════════
export const init = () => uiManager.init();
