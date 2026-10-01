// Validate against the official Schema.org vocabulary, not merely JSON syntax.
// Schema.org is an open vocabulary; this checks published terms, domain/range
// compatibility and local @id references. It is not a Google rich-result test.
export function createVocabularyValidator(vocabulary) {
  const short = value => String(value).replace(/^https?:\/\/schema\.org\//, '').replace(/^schema:/, '');
  const array = value => value === undefined ? [] : Array.isArray(value) ? value : [value];
  const ids = value => array(value).map(item => short(item['@id'] || item));
  const terms = new Map(vocabulary['@graph'].filter(item => /^(?:schema:|https?:\/\/schema\.org\/)/.test(item['@id'] || '')).map(item => [short(item['@id']), item]));
  const property = (term, key) => term?.['schema:' + key] || term?.['https://schema.org/' + key] || term?.['http://schema.org/' + key];
  const ancestorsCache = new Map();
  function ancestors(type, seen = new Set()) {
    type = short(type);
    if (ancestorsCache.has(type)) return ancestorsCache.get(type);
    if (seen.has(type)) return new Set([type]);
    seen.add(type);
    const result = new Set([type]);
    for (const parent of ids(terms.get(type)?.['rdfs:subClassOf'])) {
      for (const ancestor of ancestors(parent, new Set(seen))) result.add(ancestor);
    }
    ancestorsCache.set(type, result);
    return result;
  }
  function matches(actual, allowed) {
    return actual.some(type => allowed.some(expected => ancestors(type).has(expected)));
  }
  return function validate(document) {
    const failures = [], warnings = [], references = new Map();
    function collect(node) {
      if (Array.isArray(node)) return node.forEach(collect);
      if (!node || typeof node !== 'object') return;
      if (node['@id'] && node['@type']) references.set(node['@id'], node);
      Object.values(node).forEach(collect);
    }
    collect(document);
    function visit(node, path = '$') {
      if (Array.isArray(node)) return node.forEach((item, i) => visit(item, `${path}[${i}]`));
      if (!node || typeof node !== 'object') return;
      const nodeTypes = array(node['@type']).map(short);
      for (const type of nodeTypes) {
        if (!terms.has(type)) failures.push(`${path}: unknown Schema.org type ${type}`);
        else if (!array(terms.get(type)['@type']).includes('rdfs:Class')) failures.push(`${path}: ${type} is not a class`);
      }
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith('@')) {
          if (key === '@graph') visit(value, `${path}.@graph`);
          continue;
        }
        const name = short(key), term = terms.get(name);
        if (!term || !array(term['@type']).includes('rdf:Property')) {
          failures.push(`${path}.${key}: unknown Schema.org property`);
          continue;
        }
        const domains = ids(property(term, 'domainIncludes'));
        if (nodeTypes.length && domains.length && !matches(nodeTypes, domains)) failures.push(`${path}.${key}: not supported by ${nodeTypes.join(', ')}`);
        const ranges = ids(property(term, 'rangeIncludes'));
        for (const [i, item] of array(value).entries()) {
          if (item === null) { failures.push(`${path}.${key}[${i}]: null value`); continue; }
          if (typeof item === 'object') {
            const resolved = item['@type'] ? item : references.get(item['@id']);
            const actual = array(resolved?.['@type']).map(short);
            if (actual.length && ranges.length && !matches(actual, ranges)) failures.push(`${path}.${key}[${i}]: ${actual.join(', ')} outside range ${ranges.join(', ')}`);
            if (!actual.length && item['@id']) warnings.push(`${path}.${key}[${i}]: external reference range cannot be checked locally`);
            visit(item, `${path}.${key}[${i}]`);
          } else if (typeof item === 'number') {
            if (ranges.length && !ranges.some(type => ['Number', 'Integer', 'Float'].includes(type))) failures.push(`${path}.${key}[${i}]: numeric value outside range`);
            if (ranges.includes('Integer') && !ranges.includes('Number') && !ranges.includes('Float') && !Number.isInteger(item)) failures.push(`${path}.${key}[${i}]: integer required`);
          } else if (typeof item === 'boolean') {
            if (!ranges.includes('Boolean')) failures.push(`${path}.${key}[${i}]: boolean outside range`);
          } else if (typeof item === 'string') {
            // Schema.org accepts text/URL representations for many entity types.
            // Enforce strict lexical forms only when an exclusively scalar range
            // makes that constraint unambiguous.
            if (ranges.length === 1 && ranges[0] === 'URL' && !/^(?:https?:|mailto:)/.test(item)) failures.push(`${path}.${key}[${i}]: absolute URL required`);
            if (ranges.length && ranges.every(type => ['Date', 'DateTime'].includes(type)) && (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(item) || Number.isNaN(Date.parse(item)))) failures.push(`${path}.${key}[${i}]: invalid date`);
          }
        }
      }
    }
    visit(document);
    return { failures, warnings, valid: failures.length === 0 };
  };
}
