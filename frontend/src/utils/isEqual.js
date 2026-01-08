export function isEqual(a, b) {
  // Same reference or primitive equality
  if (a === b) return true;

  // Handle null or non-object types
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
    return false;
  }

  // Arrays vs objects mismatch
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // Different number of keys
  if (keysA.length !== keysB.length) return false;

  // Compare each key recursively
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false;
    }

    if (!isEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}
