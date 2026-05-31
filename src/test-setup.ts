import '@testing-library/jest-dom'

// Recharts uses ResizeObserver internally; jsdom does not provide it.
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom does not implement URL.createObjectURL / revokeObjectURL (used by file download).
globalThis.URL.createObjectURL = () => 'blob:mock-url'
globalThis.URL.revokeObjectURL = () => {}
