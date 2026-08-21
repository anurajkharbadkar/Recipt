import { cn } from './cn';

describe('cn', () => {
  it('joins plain class strings', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('resolves conflicting Tailwind utilities so the last one wins, unlike plain concatenation', () => {
    // This is the whole reason cn() exists over a bare clsx() call — two
    // padding utilities from different sources (e.g. a component default and
    // a caller override) would both survive naive string concatenation and
    // let CSS source order (not intent) decide which one applies.
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('merges conditional (object-form) classes from clsx', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });

  it('supports array inputs', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });
});
