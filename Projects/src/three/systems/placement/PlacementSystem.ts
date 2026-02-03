// @ts-nocheck
// Thin wrapper to ensure placement interactions get one-time listeners
// and can be toggled on/off as a system.

import { interactionManager } from '../../buttonInteract';

export class PlacementSystem {
  private _onExpand: (() => void) | null = null;
  private _onRemove: (() => void) | null = null;

  init(): void {
    this._onExpand = () => interactionManager.addBlock();
    this._onRemove = () => interactionManager.deleteModel();

    const expandBtn = document.querySelector('[data-category="terrain expansion"]');
    const removeBtn = document.querySelector('[data-category="remove"]');
    expandBtn?.addEventListener('click', this._onExpand);
    removeBtn?.addEventListener('click', this._onRemove);
  }

  update(): void {}

  dispose(): void {
    const expandBtn = document.querySelector('[data-category="terrain expansion"]');
    const removeBtn = document.querySelector('[data-category="remove"]');
    if (this._onExpand) expandBtn?.removeEventListener('click', this._onExpand);
    if (this._onRemove) removeBtn?.removeEventListener('click', this._onRemove);
  }
}
