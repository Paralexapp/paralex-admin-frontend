/**
 * What an applicant pays when Paralex stands surety: 10% of the bail amount as Paralex's fee, plus
 * 7.5% VAT on that fee. Mirrors the backend's BailBondPricing.
 *
 * The app submits the bail amount as `chargeAmount` and puts 10% of it in `totalAmount`, so
 * `totalAmount` is the fee, not the bail amount. Older applications without `chargeAmount` fall
 * back to it.
 */
export const FEE_RATE = 0.1;
export const VAT_RATE = 0.075;

const round2 = (n) => Math.round(n * 100) / 100;

export const bailBondCharges = (bond) => {
  const charge = Number(bond?.chargeAmount) || 0;
  const fee = charge > 0 ? round2(charge * FEE_RATE) : round2(Number(bond?.totalAmount) || 0);
  const bail = charge > 0 ? charge : round2(fee / FEE_RATE);
  const vat = round2(fee * VAT_RATE);
  return { bail, fee, vat, total: round2(fee + vat) };
};
