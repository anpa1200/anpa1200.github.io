const HTML_SPACE = new Set(['\t', '\n', '\f', '\r', ' ']);

function isTagBoundary(character) {
  return character === '>' || character === '/' || HTML_SPACE.has(character);
}

function findTagEnd(html, start) {
  let quote = '';
  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (quote) {
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '>') return index + 1;
  }
  return -1;
}

function findElementTag(html, lowerHtml, tagName, from, closing) {
  const prefix = `<${closing ? '/' : ''}${tagName}`;
  let index = lowerHtml.indexOf(prefix, from);
  while (index !== -1) {
    const boundary = lowerHtml[index + prefix.length];
    if (isTagBoundary(boundary)) {
      const end = findTagEnd(html, index + prefix.length);
      if (end !== -1) return { start: index, end };
      return null;
    }
    index = lowerHtml.indexOf(prefix, index + prefix.length);
  }
  return null;
}

/**
 * Transform complete HTML elements without using a regular expression as an
 * HTML parser. Script and style bodies are raw-text elements in HTML: the
 * first matching closing tag terminates the body.
 */
export function transformHtmlElements(value, tagName, transform) {
  const html = String(value ?? '');
  const normalizedTag = String(tagName).toLowerCase();
  if (!/^[a-z][a-z0-9-]*$/.test(normalizedTag)) {
    throw new TypeError(`Invalid HTML tag name: ${tagName}`);
  }

  const lowerHtml = html.toLowerCase();
  const chunks = [];
  let cursor = 0;
  let searchFrom = 0;

  while (searchFrom < html.length) {
    const opening = findElementTag(html, lowerHtml, normalizedTag, searchFrom, false);
    if (!opening) break;

    const openTag = html.slice(opening.start, opening.end);
    if (/\/\s*>$/.test(openTag)) {
      chunks.push(html.slice(cursor, opening.start));
      chunks.push(transform({
        closeTag: '',
        content: '',
        full: openTag,
        openTag,
      }) ?? openTag);
      cursor = opening.end;
      searchFrom = opening.end;
      continue;
    }

    const closing = findElementTag(html, lowerHtml, normalizedTag, opening.end, true);
    if (!closing) {
      searchFrom = opening.end;
      continue;
    }

    const closeTag = html.slice(closing.start, closing.end);
    const full = html.slice(opening.start, closing.end);
    chunks.push(html.slice(cursor, opening.start));
    chunks.push(transform({
      closeTag,
      content: html.slice(opening.end, closing.start),
      full,
      openTag,
    }) ?? full);
    cursor = closing.end;
    searchFrom = closing.end;
  }

  chunks.push(html.slice(cursor));
  return chunks.join('');
}

export function removeHtmlElements(value, tagName, predicate = () => true) {
  return transformHtmlElements(value, tagName, (element) => (
    predicate(element) ? '' : element.full
  ));
}

export function htmlTextContent(value) {
  let html = removeHtmlElements(value, 'script');
  html = removeHtmlElements(html, 'style');

  const chunks = [];
  let cursor = 0;
  while (cursor < html.length) {
    const opening = html.indexOf('<', cursor);
    if (opening === -1) {
      chunks.push(html.slice(cursor));
      break;
    }
    chunks.push(html.slice(cursor, opening), ' ');
    const end = findTagEnd(html, opening + 1);
    if (end === -1) {
      chunks.push(html.slice(opening));
      break;
    }
    cursor = end;
  }
  return chunks.join('');
}
