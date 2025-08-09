// Minimal pub/sub event bus to decouple systems

const typeToHandlers = new Map();

export function on(type, handler) {
  const arr = typeToHandlers.get(type) || [];
  arr.push(handler);
  typeToHandlers.set(type, arr);
  return () => off(type, handler);
}

export function off(type, handler) {
  const arr = typeToHandlers.get(type);
  if (!arr) return;
  const idx = arr.indexOf(handler);
  if (idx >= 0) arr.splice(idx, 1);
}

export function emit(type, payload) {
  const arr = typeToHandlers.get(type) || [];
  for (const h of arr) h?.(payload);
}


