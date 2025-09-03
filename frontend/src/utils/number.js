export function n(val, decimals = 3) {
  const rounded = parseFloat(val.toFixed(decimals));
  return rounded
    .toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    })
    .replace(/,/g, " ");
}
