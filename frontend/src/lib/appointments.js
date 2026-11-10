export function billBalance(bill) {
  return bill.status === 'paid' ? 0 : Number(bill.total);
}
