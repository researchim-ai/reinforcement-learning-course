import katex from 'katex';

export function renderMath(tex, displayMode = false) {
  return katex.renderToString(tex, {
    displayMode,
    output: 'htmlAndMathml',
    throwOnError: true,
    strict: 'error',
    trust: false,
    maxExpand: 1000,
  });
}

const escapeHTML = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export function renderMathText(text) {
  return text.split(/(\$[^$]+\$)/g).map(part =>
    part.startsWith('$') && part.endsWith('$')
      ? `<span class="inline-math${part.length > 65 ? ' math-long' : ''}">${renderMath(part.slice(1, -1))}</span>`
      : escapeHTML(part),
  ).join('');
}
