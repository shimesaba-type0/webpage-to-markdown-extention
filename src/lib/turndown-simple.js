/**
 * SimpleTurndown - Lightweight HTML to Markdown converter
 * A minimal implementation for basic HTML to Markdown conversion
 */

class TurndownService {
  constructor(options = {}) {
    this.options = {
      headingStyle: options.headingStyle || 'atx', // atx: ##, setext: underline
      codeBlockStyle: options.codeBlockStyle || 'fenced', // fenced: ```, indented: 4 spaces
      ...options
    };
  }

  turndown(html) {
    if (typeof html !== 'string') return '';

    // Create temporary div for parsing
    const div = document.createElement('div');
    div.innerHTML = html;

    return this.processNode(div).trim();
  }

  processNode(node) {
    let markdown = '';

    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        markdown += this.escapeMarkdown(child.textContent);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        markdown += this.processElement(child);
      }
    }

    return markdown;
  }

  processElement(element) {
    const tagName = element.tagName.toLowerCase();
    const content = this.processNode(element);

    switch (tagName) {
      // Headings
      case 'h1': return `\n# ${content}\n\n`;
      case 'h2': return `\n## ${content}\n\n`;
      case 'h3': return `\n### ${content}\n\n`;
      case 'h4': return `\n#### ${content}\n\n`;
      case 'h5': return `\n##### ${content}\n\n`;
      case 'h6': return `\n###### ${content}\n\n`;

      // Paragraphs
      case 'p': return `\n${content}\n\n`;
      case 'br': return '  \n';

      // Text formatting
      case 'strong':
      case 'b': return `**${content}**`;
      case 'em':
      case 'i': return `*${content}*`;
      case 'code': return `\`${content}\``;
      case 'del':
      case 's': return `~~${content}~~`;

      // Links
      case 'a': {
        const href = element.getAttribute('href') || '';
        const title = element.getAttribute('title');
        if (title) {
          return `[${content}](${href} "${title}")`;
        }
        return `[${content}](${href})`;
      }

      // Images
      case 'img': {
        const src = element.getAttribute('src') || '';
        const alt = element.getAttribute('alt') || '';
        const title = element.getAttribute('title');
        if (title) {
          return `![${alt}](${src} "${title}")`;
        }
        return `![${alt}](${src})`;
      }

      // Lists
      case 'ul': return `\n${this.processList(element, false)}\n`;
      case 'ol': return `\n${this.processList(element, true)}\n`;
      case 'li': return content; // Handled by processList

      // Code blocks
      case 'pre': {
        const code = element.querySelector('code');
        if (code) {
          const language = this.getCodeLanguage(code);
          const codeContent = code.textContent || '';
          if (this.options.codeBlockStyle === 'fenced') {
            return `\n\`\`\`${language}\n${codeContent}\n\`\`\`\n\n`;
          } else {
            return '\n' + codeContent.split('\n').map(line => '    ' + line).join('\n') + '\n\n';
          }
        }
        return `\n\`\`\`\n${content}\n\`\`\`\n\n`;
      }

      // Blockquote
      case 'blockquote': {
        const lines = content.trim().split('\n');
        return '\n' + lines.map(line => `> ${line}`).join('\n') + '\n\n';
      }

      // Horizontal rule
      case 'hr': return '\n---\n\n';

      // Tables
      case 'table': return this.processTable(element);

      // Division and spans (just return content)
      case 'div':
      case 'span':
      case 'section':
      case 'article':
        return content;

      // Skip script, style, etc.
      case 'script':
      case 'style':
      case 'noscript':
        return '';

      default:
        return content;
    }
  }

  processList(listElement, ordered = false) {
    const items = Array.from(listElement.children).filter(child =>
      child.tagName.toLowerCase() === 'li'
    );

    return items.map((item, index) => {
      const marker = ordered ? `${index + 1}. ` : '- ';
      const content = this.processNode(item).trim();
      return marker + content;
    }).join('\n');
  }

  processTable(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    let markdown = '\n';

    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const cellContents = cells.map(cell => this.processNode(cell).trim());
      markdown += '| ' + cellContents.join(' | ') + ' |\n';

      // Add header separator after first row
      if (rowIndex === 0) {
        markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
      }
    });

    return markdown + '\n';
  }

  getCodeLanguage(codeElement) {
    const className = codeElement.className || '';
    const match = className.match(/language-(\w+)/);
    return match ? match[1] : '';
  }

  escapeMarkdown(text) {
    // Escape special markdown characters
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/`/g, '\\`')
      .replace(/~/g, '\\~')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }
}

// Make it available globally for content scripts
if (typeof window !== 'undefined') {
  window.TurndownService = TurndownService;
}
