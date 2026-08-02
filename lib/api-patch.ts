// API URL patcher for Capacitor/mobile builds
// When __API_BASE__ is set (APK build), redirects all /api/* calls to the live backend
declare const __API_BASE__: string;

if (typeof __API_BASE__ !== 'undefined' && __API_BASE__) {
  const _fetch = window.fetch.bind(window);
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return _fetch(__API_BASE__ + input, init);
    }
    if (input instanceof Request) {
      const url = typeof input.url === 'string' ? input.url : input.url.toString();
      if (url.startsWith('/api/')) {
        return _fetch(new Request(__API_BASE__ + url, input), init);
      }
    }
    return _fetch(input, init);
  };
}
