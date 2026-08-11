type Listener = (loading: boolean) => void;

let activeRequests = 0;
const listeners = new Set<Listener>();

function notify() {
  const loading = activeRequests > 0;
  listeners.forEach((listener) => listener(loading));
}

export function beginRequest() {
  activeRequests += 1;
  notify();
}

export function endRequest() {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
}

export function subscribeLoading(listener: Listener): () => void {
  listeners.add(listener);
  listener(activeRequests > 0);
  return () => listeners.delete(listener);
}
