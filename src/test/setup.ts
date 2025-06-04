import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { TextEncoder, TextDecoder } from 'util';

// Mock window.crypto for encryption tests
const cryptoMock = {
  getRandomValues: (buffer: Uint8Array) => buffer.map(() => Math.floor(Math.random() * 256)),
  subtle: {
    importKey: vi.fn().mockResolvedValue('mock-key'),
    encrypt: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    decrypt: vi.fn().mockImplementation(async (_, __, data) => data)
  }
};

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto
global.crypto = cryptoMock as unknown as Crypto;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));