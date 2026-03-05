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
});
