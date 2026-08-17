'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

export interface PickerOption {
  value: string;
  label: string;
}

interface PickerWithAddProps {
  value: string;
  onChange: (value: string) => void;
  options: PickerOption[];
  /** Called with the trimmed new label; must resolve to the value the newly-created option should use (usually the label itself, or a server-assigned id). */
  onAddNew: (label: string) => Promise<string>;
  placeholder?: string;
  addLabel?: string;
  addPlaceholder?: string;
  className?: string;
}

const ADD_NEW_SENTINEL = '__ADD_NEW__';

/**
 * A <select> with a trailing "+ Add new…" option. Picking it swaps in a small
 * inline text input instead of navigating anywhere — used for Collection
 * Area / Expense Category / Donation Category pickers so a collector or
 * treasurer filling out a receipt/expense doesn't need a trip to Settings to
 * extend the list. See PendingPaymentBanner-adjacent forms for the two other
 * call sites (receipts/new, expenses).
 */
export default function PickerWithAdd({
  value, onChange, options, onAddNew,
  placeholder = 'Select…', addLabel = '+ Add new…', addPlaceholder = 'Type a new name…',
  className = 'form-select',
}: PickerWithAddProps) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === ADD_NEW_SENTINEL) {
      setAdding(true);
      return;
    }
    onChange(e.target.value);
  };

  const handleAdd = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setSaving(true);
    try {
      const newValue = await onAddNew(label);
      onChange(newValue);
      setAdding(false);
      setNewLabel('');
    } finally {
      setSaving(false);
    }
  };

  if (adding) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          className="form-input flex-1"
          placeholder={addPlaceholder}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newLabel.trim() || saving}
          className="btn-primary px-3 shrink-0"
          aria-label="Add"
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          onClick={() => { setAdding(false); setNewLabel(''); }}
          className="btn-secondary px-3 shrink-0"
          aria-label="Cancel"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <select value={value} onChange={handleSelectChange} className={className}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
      <option value={ADD_NEW_SENTINEL}>{addLabel}</option>
    </select>
  );
}
