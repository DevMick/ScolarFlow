// ========================================
// JEST SETUP - CONFIGURATION GLOBALE DES TESTS
// ========================================

import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock de l'API Performance si elle n'existe pas
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    clearResourceTimings: jest.fn(),
    setResourceTimingBufferSize: jest.fn(),
    toJSON: jest.fn(() => ({}))
  } as any;
}

// Mock de l'API ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock de l'API IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: []
}));

// Mock de requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  return setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = jest.fn((id) => {
  clearTimeout(id);
});

// Mock de l'API Clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
  },
});

// Mock de l'API File
global.File = class MockFile {
  constructor(
    public chunks: (string | ArrayBuffer | ArrayBufferView)[],
    public name: string,
    public options: FilePropertyBag = {}
  ) {}
  
  get size() {
    return this.chunks.reduce((size, chunk) => {
      if (typeof chunk === 'string') {
        return size + chunk.length;
      }
      return size + chunk.byteLength;
    }, 0);
  }
  
  get type() {
    return this.options.type || '';
  }
  
  get lastModified() {
    return this.options.lastModified || Date.now();
  }
} as any;

// Mock de l'API Blob
global.Blob = class MockBlob {
  constructor(
    public chunks: (string | ArrayBuffer | ArrayBufferView | Blob)[] = [],
    public options: BlobPropertyBag = {}
  ) {}
  
  get size() {
    return this.chunks.reduce((size, chunk) => {
      if (typeof chunk === 'string') {
        return size + chunk.length;
      }
      if (chunk instanceof MockBlob) {
        return size + chunk.size;
      }
      return size + chunk.byteLength;
    }, 0);
  }
  
  get type() {
    return this.options.type || '';
  }
  
  slice(start?: number, end?: number, contentType?: string) {
    return new MockBlob([], { type: contentType });
  }
  
  text() {
    return Promise.resolve(this.chunks.join(''));
  }
  
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
} as any;

// Mock de l'API URL
global.URL = {
  createObjectURL: jest.fn(() => 'mock-object-url'),
  revokeObjectURL: jest.fn(),
} as any;

// Mock de l'API Canvas pour html2canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4)
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4)
  })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
})) as any;

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock-image-data');
HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  callback(new global.Blob(['mock-image-data'], { type: 'image/png' }));
});

// Mock de l'API MediaQuery
global.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock de l'API Connection (Network Information)
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  }
});

// Mock de l'API Memory (Performance Memory)
Object.defineProperty(performance, 'memory', {
  writable: true,
  value: {
    usedJSHeapSize: 10000000,  // 10MB
    totalJSHeapSize: 50000000, // 50MB
    jsHeapSizeLimit: 100000000 // 100MB
  }
});

// Mock de l'API Navigation Timing
Object.defineProperty(performance, 'getEntriesByType', {
  writable: true,
  value: jest.fn((type: string) => {
    if (type === 'navigation') {
      return [{
        domContentLoadedEventStart: 1000,
        domContentLoadedEventEnd: 1100,
        loadEventStart: 1500,
        loadEventEnd: 1600,
      }];
    }
    if (type === 'paint') {
      return [
        { name: 'first-paint', startTime: 800 },
        { name: 'first-contentful-paint', startTime: 900 }
      ];
    }
    return [];
  })
});

// Configuration globale pour les tests
beforeEach(() => {
  // Nettoyer les mocks avant chaque test
  jest.clearAllMocks();
  
  // Réinitialiser les timers
  jest.clearAllTimers();
  
  // Nettoyer le localStorage
  localStorage.clear();
  
  // Nettoyer le sessionStorage
  sessionStorage.clear();
  
  // Réinitialiser les variables d'environnement de test
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  // Nettoyer après chaque test
  jest.restoreAllMocks();
});

// Configuration pour les tests asynchrones
jest.setTimeout(10000);

// Supprimer les warnings de console pendant les tests (optionnel)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock des modules externes problématiques
jest.mock('chart.js/auto', () => ({
  Chart: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    update: jest.fn(),
    render: jest.fn(),
    resize: jest.fn(),
  })),
  registerables: []
}));

jest.mock('html2canvas', () => jest.fn().mockResolvedValue({
  toDataURL: jest.fn(() => 'data:image/png;base64,mock-image-data'),
  toBlob: jest.fn((callback) => {
    callback(new global.Blob(['mock-image-data'], { type: 'image/png' }));
  }),
  width: 800,
  height: 600
}));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    addPage: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    addImage: jest.fn(),
    save: jest.fn(),
    internal: {
      pageSize: {
        getWidth: jest.fn(() => 210),
        getHeight: jest.fn(() => 297)
      },
      getCurrentPageInfo: jest.fn(() => ({ pageNumber: 1 }))
    },
    setProperties: jest.fn(),
    splitTextToSize: jest.fn((text) => [text]),
    line: jest.fn()
  }))
}));

// Utilitaires de test personnalisés
export const createMockStatisticResult = (overrides = {}) => ({
  id: 'mock-result-1',
  configurationId: 'mock-config-1',
  configuration: {
    id: 'mock-config-1',
    name: 'Mock Analysis',
    description: 'Mock analysis for testing',
    category: 'performance' as const,
    dataSources: {
      evaluationIds: [1, 2],
      classIds: [1],
      dateRange: [new Date('2024-01-01'), new Date('2024-03-01')],
      subjectFilters: [],
      typeFilters: [],
      excludeAbsent: true,
      excludeIncomplete: false
    },
    calculations: {
      type: 'basic' as const,
      metrics: ['average', 'median'],
      groupBy: 'student' as const,
      aggregation: 'average' as const
    },
    visualization: {
      chartType: 'bar' as const,
      multiSeries: false,
      colors: ['#3B82F6'],
      layout: 'single' as const,
      annotations: false,
      showGrid: true,
      showLegend: true
    },
    isTemplate: false,
    isPublic: false,
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 1
  },
  generatedBy: 1,
  datasets: [{
    label: 'Test Dataset',
    data: [
      { label: 'Student 1', value: 15, metadata: {} },
      { label: 'Student 2', value: 12, metadata: {} },
      { label: 'Student 3', value: 18, metadata: {} }
    ]
  }],
  summary: {
    totalDataPoints: 3,
    timeRange: [new Date('2024-01-01'), new Date('2024-03-01')],
    calculatedAt: new Date(),
    processingTime: 150
  },
  statistics: {
    global: {
      average: 15,
      median: 15,
      standardDeviation: 3,
      min: 12,
      max: 18,
      trend: 'stable' as const
    }
  },
  insights: [{
    type: 'positive',
    title: 'Good class average',
    description: 'The class has a good overall average',
    confidence: 0.8,
    priority: 'medium' as const,
    metadata: {}
  }],
  cacheKey: 'mock-cache-key',
  expiresAt: new Date(Date.now() + 300000),
  createdAt: new Date(),
  ...overrides
});

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0));

export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  });
  window.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
};
