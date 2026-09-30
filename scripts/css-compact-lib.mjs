// Conservative, dependency-free CSS compaction for the staged release:
// comments and redundant whitespace only. Strings, url(...) and the spaces
// that carry meaning (calc operators, descendant combinators, media
// keywords) are preserved; declarations and selectors are never rewritten.

const DROP_BEFORE = new Set(['{', '}', ';', ',', '>', ')']);
const DROP_AFTER = new Set(['{', '}', ';', ',', '>', '(', ':']);

export function compactCss(css) {
  let out = '';
  let space = false;
  const emit = (text) => {
    if (space && out && !DROP_AFTER.has(out.at(-1)) && !out.endsWith('*/') && !DROP_BEFORE.has(text[0])) out += ' ';
    space = false;
    if (text === '}' && out.at(-1) === ';') out = out.slice(0, -1);
    out += text;
  };
  for (let i = 0; i < css.length;) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const stop = end < 0 ? css.length : end + 2;
      if (css[i + 2] === '!') emit(css.slice(i, stop)); // license comments stay
      else space = true;
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c) j += css[j] === '\\' ? 2 : 1;
      emit(css.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (/\s/.test(c)) {
      space = true;
      i += 1;
      continue;
    }
    // Unquoted url(...) is copied verbatim; it cannot contain ")" or spaces.
    if (/^url\(\s*[^"'\s)]/i.test(css.slice(i, i + 6)) && !/[\w-]/.test(css[i - 1] || '')) {
      const end = css.indexOf(')', i);
      const stop = end < 0 ? css.length : end + 1;
      emit(css.slice(i, stop));
      i = stop;
      continue;
    }
    emit(c);
    i += 1;
  }
  return out.trim();
}

// Inline <style> blocks of standalone pages. Docusaurus pages are skipped:
// their server HTML must stay identical to what React hydrates.
export function compactInlineStyles(html) {
  if (/\bid=["']__docusaurus["']/i.test(html)) return html;
  return html.replace(/(<style\b([^>]*)>)([\s\S]*?)(<\/style>)/gi, (whole, open, attributes, css, close) => {
    const type = attributes.match(/\btype\s*=\s*["']?([^"'\s>]+)/i)?.[1];
    if (type && type.toLowerCase() !== 'text/css') return whole;
    return `${open}${compactCss(css)}${close}`;
  });
}
