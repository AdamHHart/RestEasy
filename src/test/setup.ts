import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.crypto for encryption tests
const cryptoMock = {
  getRandomValues: (buffer: Uint8Array) => buffer.map(() => Math.floor(Math.random() * 256)),
  subtle: {
    importKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn()
  }
};

vi.stubGlobal('crypto', cryptoMock);

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