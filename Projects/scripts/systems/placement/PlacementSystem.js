// Thin wrapper to ensure placement interactions get one-time listeners
// and can be toggled on/off as a system.

import { deleteModel, addBlock } from '../../buttonInteract.js';

export class PlacementSystem {
  init() {
    this._onExpand = () => addBlock();
    this._onRemove = () => deleteModel();

    const expandBtn = document.querySelector('[data-category="terrain expansion"]');
    const removeBtn = document.querySelector('[data-category="remove"]');
    expandBtn?.addEventListener('click', this._onExpand);
    removeBtn?.addEventListener('click', this._onRemove);
  }

  update() {}

  dispose() {
    const expandBtn = document.querySelector('[data-category="terrain expansion"]');
    const removeBtn = document.querySelector('[data-category="remove"]');
    expandBtn?.removeEventListener('click', this._onExpand);
    removeBtn?.removeEventListener('click', this._onRemove);
  }
}


