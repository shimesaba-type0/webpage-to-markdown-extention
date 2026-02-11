/**
 * Jest Setup File
 * Mocks Chrome Extension APIs and global objects
 */

// Mock Chrome Extension APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    openOptionsPage: jest.fn()
  },
  storage: {
    sync: {
      get: jest.fn((keys) => Promise.resolve(keys)),
      set: jest.fn(() => Promise.resolve())
    },
    local: {
      get: jest.fn((keys) => Promise.resolve(keys)),
      set: jest.fn(() => Promise.resolve())
    }
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([{ id: 1, url: 'https://example.com' }])),
    sendMessage: jest.fn(() => Promise.resolve({ success: true }))
  },
  downloads: {
    download: jest.fn(() => Promise.resolve(1))
  }
};

// Mock IndexedDB
global.indexedDB = {
  deleteDatabase: jest.fn(() => ({
    onsuccess: null,
    onerror: null
  }))
};

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};
