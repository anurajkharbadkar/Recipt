import { buildUpiPaymentLink } from './upi';

describe('buildUpiPaymentLink', () => {
  it('builds a standard upi://pay link with all fields', () => {
    const link = buildUpiPaymentLink({
      upiId: 'shreeganesh@sbi',
      payeeName: 'Shree Ganesh Mandal',
      amount: 1100,
      note: 'SGM-2026-0001',
    });
    expect(link).toBe(
      'upi://pay?pa=shreeganesh%40sbi&pn=Shree+Ganesh+Mandal&am=1100.00&cu=INR&tn=SGM-2026-0001',
    );
  });

  it('omits am= when amount is missing or non-positive, so the payer\'s app prompts for it', () => {
    expect(buildUpiPaymentLink({ upiId: 'x@sbi', payeeName: 'X', amount: 0 })).not.toContain('am=');
    expect(buildUpiPaymentLink({ upiId: 'x@sbi', payeeName: 'X', amount: -5 })).not.toContain('am=');
  });

  it('omits tn= when no note is given — it is optional per the UPI spec', () => {
    const link = buildUpiPaymentLink({ upiId: 'x@sbi', payeeName: 'X', amount: 50 });
    expect(link).not.toContain('tn=');
  });

  it('always includes cu=INR', () => {
    const link = buildUpiPaymentLink({ upiId: 'x@sbi', payeeName: 'X', amount: 50 });
    expect(link).toContain('cu=INR');
  });
});
