// Amounts are held as integer paise in the UI; the API sends rupees as decimals.
export function toPaise(rupees) {
  if (rupees === null || rupees === undefined || rupees === "") return 0;
  return Math.round(Number(rupees) * 100);
}

const formatters = new Map();
export function inr(paise) {
  const fraction = paise % 100 === 0 ? 0 : 2;
  if (!formatters.has(fraction)) {
    formatters.set(fraction, new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    }));
  }
  return formatters.get(fraction).format(paise / 100);
}
