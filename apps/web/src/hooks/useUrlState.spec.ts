import { renderHook, act } from '@testing-library/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useUrlState } from './useUrlState';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const mockedUseRouter = useRouter as jest.Mock;
const mockedUsePathname = usePathname as jest.Mock;
const mockedUseSearchParams = useSearchParams as jest.Mock;

function setup(query: string) {
  const replace = jest.fn();
  mockedUseRouter.mockReturnValue({ replace });
  mockedUsePathname.mockReturnValue('/receipts');
  mockedUseSearchParams.mockReturnValue(new URLSearchParams(query));
  const { result } = renderHook(() => useUrlState());
  return { result, replace };
}

describe('useUrlState', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('get', () => {
    it('reads a present key', () => {
      const { result } = setup('search=ganesh');
      expect(result.current.get('search')).toBe('ganesh');
    });

    it('falls back for a missing key', () => {
      const { result } = setup('');
      expect(result.current.get('search', 'default')).toBe('default');
    });

    it('defaults the fallback to an empty string', () => {
      const { result } = setup('');
      expect(result.current.get('search')).toBe('');
    });
  });

  describe('getNumber', () => {
    it('parses a valid positive integer', () => {
      const { result } = setup('page=3');
      expect(result.current.getNumber('page', 1)).toBe(3);
    });

    it('falls back on a missing key', () => {
      const { result } = setup('');
      expect(result.current.getNumber('page', 1)).toBe(1);
    });

    it('falls back on a non-numeric value rather than returning NaN', () => {
      const { result } = setup('page=abc');
      expect(result.current.getNumber('page', 1)).toBe(1);
    });

    it('falls back on zero or a negative value — page numbers start at 1', () => {
      const { result } = setup('page=0');
      expect(result.current.getNumber('page', 1)).toBe(1);
      mockedUseSearchParams.mockReturnValue(new URLSearchParams('page=-5'));
      const { result: result2 } = renderHook(() => useUrlState());
      expect(result2.current.getNumber('page', 1)).toBe(1);
    });
  });

  describe('setParams', () => {
    it('sets a new key via router.replace, preserving existing params', () => {
      const { result, replace } = setup('status=PAID');
      act(() => result.current.setParams({ search: 'ganesh' }));
      expect(replace).toHaveBeenCalledWith('/receipts?status=PAID&search=ganesh', { scroll: false });
    });

    it('removes a key when the value is an empty string, null, or undefined', () => {
      const { result, replace } = setup('search=ganesh&status=PAID');
      act(() => result.current.setParams({ search: '' }));
      expect(replace).toHaveBeenCalledWith('/receipts?status=PAID', { scroll: false });
    });

    it('resets page to 1 (by dropping it) whenever an unrelated param changes', () => {
      const { result, replace } = setup('page=4&search=old');
      act(() => result.current.setParams({ search: 'new' }));
      expect(replace).toHaveBeenCalledWith('/receipts?search=new', { scroll: false });
    });

    it('does not drop page when the change is a page navigation itself', () => {
      const { result, replace } = setup('page=4&search=ganesh');
      act(() => result.current.setParams({ page: 5 }, { resetPage: false }));
      expect(replace).toHaveBeenCalledWith('/receipts?page=5&search=ganesh', { scroll: false });
    });

    it('navigates to the bare pathname when every param is cleared', () => {
      const { result, replace } = setup('search=ganesh');
      act(() => result.current.setParams({ search: '' }));
      expect(replace).toHaveBeenCalledWith('/receipts', { scroll: false });
    });
  });
});
