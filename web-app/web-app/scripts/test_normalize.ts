function normalizeValue(value: string): any {
  value = value.trim();
  if (value === 'NULL' || value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  let isJsonb = false;
  if (value.endsWith('::jsonb')) {
    value = value.substring(0, value.length - 7).trim();
    isJsonb = true;
  }
  
  if (value.startsWith("'") && value.endsWith("'")) {
    const strVal = value.substring(1, value.length - 1).replace(/''/g, "'");
    if (isJsonb) {
      try {
        return JSON.parse(strVal);
      } catch (e) {
        return strVal;
      }
    }
    return strVal;
  }
  
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }
  return value;
}

const raw = "'[]'::jsonb";
const normalized = normalizeValue(raw);
console.log('Raw:', raw);
console.log('Normalized:', normalized);
console.log('Type of Normalized:', typeof normalized);
console.log('Is Array:', Array.isArray(normalized));
