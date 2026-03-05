/**
 * Tests for file-exporter.js
 */

const JSZip = require('jszip');
const fileExporter = require('../src/export/file-exporter.js');

describe('FileExporter', () => {
  beforeAll(() => {
    global.JSZip = JSZip;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('exports single article with image filename derived from localPath basename', async () => {
    const article = {
      metadata: { title: 'Single Article' },
      markdown: '![img](./images/photo_01.png)'
    };
    const images = [
      {
        id: 10,
        blob: new Blob(['image-bytes'], { type: 'image/png' }),
        localPath: './images/photo_01.png',
        mimeType: 'image/png'
      }
    ];

    let capturedBlob = null;
    jest.spyOn(fileExporter, 'downloadBlob').mockImplementation(async (blob) => {
      capturedBlob = blob;
      return 1;
    });

    await fileExporter.exportArticle(article, images);

    const zip = await JSZip.loadAsync(capturedBlob);
    expect(zip.file('Single_Article.md')).toBeTruthy();
    expect(zip.file('images/photo_01.png')).toBeTruthy();
    expect(zip.file('images/image-10.jpg')).toBeFalsy();
  });

  test('exports multiple articles with per-article images using localPath basename', async () => {
    const articlesData = [
      {
        article: {
          metadata: { title: 'First' },
          markdown: '![a](./images/first.png)'
        },
        images: [
          {
            id: 1,
            blob: new Blob(['a'], { type: 'image/png' }),
            localPath: './images/first.png',
            mimeType: 'image/png'
          }
        ]
      },
      {
        article: {
          metadata: { title: 'Second' },
          markdown: '![b](./images/second.webp)'
        },
        images: [
          {
            id: 2,
            blob: new Blob(['b'], { type: 'image/webp' }),
            localPath: './images/second.webp',
            mimeType: 'image/webp'
          }
        ]
      }
    ];

    let capturedBlob = null;
    jest.spyOn(fileExporter, 'downloadBlob').mockImplementation(async (blob) => {
      capturedBlob = blob;
      return 1;
    });

    await fileExporter.exportMultipleArticles(articlesData);

    const zip = await JSZip.loadAsync(capturedBlob);
    expect(zip.file('1_First/article.md')).toBeTruthy();
    expect(zip.file('1_First/images/first.png')).toBeTruthy();
    expect(zip.file('2_Second/article.md')).toBeTruthy();
    expect(zip.file('2_Second/images/second.webp')).toBeTruthy();
  });

  test('falls back to image-id plus mime extension when localPath and filename are missing', async () => {
    const article = {
      metadata: { title: 'Fallback' },
      markdown: '![x](./images/unknown.webp)'
    };
    const images = [
      {
        id: 42,
        blob: new Blob(['x'], { type: 'image/webp' }),
        mimeType: 'image/webp'
      }
    ];

    let capturedBlob = null;
    jest.spyOn(fileExporter, 'downloadBlob').mockImplementation(async (blob) => {
      capturedBlob = blob;
      return 1;
    });

    await fileExporter.exportArticle(article, images);

    const zip = await JSZip.loadAsync(capturedBlob);
    expect(zip.file('images/image-42.webp')).toBeTruthy();
  });

  // Issue #142: Additional edge-case tests for filename resolution

  test('uses filename when localPath is absent (filename fallback)', async () => {
    const article = {
      metadata: { title: 'FilenameTest' },
      markdown: '![img](./images/photo.jpg)'
    };
    const images = [
      {
        id: 5,
        blob: new Blob(['bytes'], { type: 'image/jpeg' }),
        filename: 'photo.jpg',
        mimeType: 'image/jpeg'
        // localPath intentionally omitted
      }
    ];

    let capturedBlob = null;
    jest.spyOn(fileExporter, 'downloadBlob').mockImplementation(async (blob) => {
      capturedBlob = blob;
      return 1;
    });

    await fileExporter.exportArticle(article, images);

    const zip = await JSZip.loadAsync(capturedBlob);
    expect(zip.file('images/photo.jpg')).toBeTruthy();
    expect(zip.file('images/image-5.jpg')).toBeFalsy();
  });

  test('sanitizes filename when it contains unsafe characters', async () => {
    const article = {
      metadata: { title: 'SafenameTest' },
      markdown: '![img](./images/unsafe.jpg)'
    };
    const images = [
      {
        id: 7,
        blob: new Blob(['bytes'], { type: 'image/jpeg' }),
        filename: 'my<unsafe>file.jpg',
        mimeType: 'image/jpeg'
      }
    ];

    let capturedBlob = null;
    jest.spyOn(fileExporter, 'downloadBlob').mockImplementation(async (blob) => {
      capturedBlob = blob;
      return 1;
    });

    await fileExporter.exportArticle(article, images);

    const zip = await JSZip.loadAsync(capturedBlob);
    // Unsafe characters replaced by sanitizeFilename
    expect(zip.file('images/my_unsafe_file.jpg')).toBeTruthy();
  });

  test('extracts basename correctly from Windows-style backslash path', async () => {
    const article = {
      metadata: { title: 'WindowsPath' },
      markdown: '![img](.\\images\\photo.png)'
    };
    const images = [
      {
        id: 9,
        blob: new Blob(['bytes'], { type: 'image/png' }),
        localPath: '.\\images\\photo.png',
        mimeType: 'image/png'
      }
    ];

    let capturedBlob = null;
    jest.spyOn(fileExporter, 'downloadBlob').mockImplementation(async (blob) => {
      capturedBlob = blob;
      return 1;
    });

    await fileExporter.exportArticle(article, images);

    const zip = await JSZip.loadAsync(capturedBlob);
    expect(zip.file('images/photo.png')).toBeTruthy();
  });

  test('later image overwrites earlier image with same basename (collision behavior)', async () => {
    // Current behavior: last image wins for duplicate basenames.
    // In practice this is rare because generateLocalPath uses index-based naming.
    const article = {
      metadata: { title: 'Collision' },
      markdown: '# Collision'
    };
    const images = [
      {
        id: 1,
        blob: new Blob(['first'], { type: 'image/png' }),
        localPath: './images/photo.png',
        mimeType: 'image/png'
      },
      {
        id: 2,
        blob: new Blob(['second'], { type: 'image/png' }),
        localPath: './images/photo.png',
        mimeType: 'image/png'
      }
    ];

    let capturedBlob = null;
    jest.spyOn(fileExporter, 'downloadBlob').mockImplementation(async (blob) => {
      capturedBlob = blob;
      return 1;
    });

    await fileExporter.exportArticle(article, images);

    const zip = await JSZip.loadAsync(capturedBlob);
    const file = zip.file('images/photo.png');
    expect(file).toBeTruthy();
    const content = await file.async('text');
    // Last image wins (JSZip overwrites)
    expect(content).toBe('second');
  });

  test('skips metadata.json when includeMetadata option is false', async () => {
    const article = {
      metadata: { title: 'NoMeta' },
      markdown: '# No metadata'
    };

    let capturedBlob = null;
    jest.spyOn(fileExporter, 'downloadBlob').mockImplementation(async (blob) => {
      capturedBlob = blob;
      return 1;
    });

    await fileExporter.exportArticle(article, [], { includeMetadata: false });

    const zip = await JSZip.loadAsync(capturedBlob);
    expect(zip.file('metadata.json')).toBeFalsy();
    expect(zip.file('NoMeta.md')).toBeTruthy();
  });

  test('includes metadata.json by default', async () => {
    const article = {
      metadata: { title: 'WithMeta' },
      markdown: '# With metadata'
    };

    let capturedBlob = null;
    jest.spyOn(fileExporter, 'downloadBlob').mockImplementation(async (blob) => {
      capturedBlob = blob;
      return 1;
    });

    await fileExporter.exportArticle(article, []);

    const zip = await JSZip.loadAsync(capturedBlob);
    expect(zip.file('metadata.json')).toBeTruthy();
  });
});
