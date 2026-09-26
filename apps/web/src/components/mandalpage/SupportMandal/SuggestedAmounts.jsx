import { useLanguage } from '@/hooks/useLanguage';

/**
 * SuggestedAmounts — Optional quick contribution amount selectors
 */
export default function SuggestedAmounts({
  amounts,
  selectedAmount,
  onSelectAmount,
  customAmount,
  onCustomAmountChange,
}) {
  const { t } = useLanguage();

  if (!amounts || amounts.length === 0) return null;

  return (
    <div className="suggested-amounts" role="group" aria-labelledby="suggested-amounts-label">
      <label id="suggested-amounts-label" className="suggested-amounts__label">
        {t('suggestedContribution')}
      </label>

      <div className="suggested-amounts__pills">
        {amounts.map(amt => {
          const isSelected = selectedAmount === amt && !customAmount;
          return (
            <button
              key={amt}
              type="button"
              className={`suggested-amounts__pill ${isSelected ? 'suggested-amounts__pill--active' : ''}`}
              onClick={() => onSelectAmount(amt)}
              aria-pressed={isSelected}
            >
              ₹{amt.toLocaleString('en-IN')}
            </button>
          );
        })}
      </div>

      <div className="suggested-amounts__custom-wrap">
        <span className="suggested-amounts__currency-symbol">₹</span>
        <input
          type="number"
          min="1"
          placeholder={t('enterAmount')}
          value={customAmount}
          onChange={(e) => onCustomAmountChange(e.target.value)}
          className="suggested-amounts__input"
          aria-label={t('customAmount')}
        />
        {customAmount && (
          <button
            type="button"
            className="suggested-amounts__clear-btn"
            onClick={() => onCustomAmountChange('')}
            title="Clear custom amount"
            aria-label="Clear custom amount"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
