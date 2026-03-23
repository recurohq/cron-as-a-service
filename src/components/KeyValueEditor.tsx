interface KeyValueEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  label?: string;
}

export function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  label,
}: KeyValueEditorProps) {
  const entries = Object.entries(value);

  const handleKeyChange = (oldKey: string, newKey: string) => {
    const newValue: Record<string, string> = {};
    for (const [k, v] of entries) {
      if (k === oldKey) {
        newValue[newKey] = v;
      } else {
        newValue[k] = v;
      }
    }
    onChange(newValue);
  };

  const handleValueChange = (key: string, newVal: string) => {
    onChange({ ...value, [key]: newVal });
  };

  const handleAdd = () => {
    const newKey = `header-${entries.length + 1}`;
    onChange({ ...value, [newKey]: '' });
  };

  const handleRemove = (key: string) => {
    const newValue = { ...value };
    delete newValue[key];
    onChange(newValue);
  };

  const inputClass = 'flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] placeholder:text-[var(--text-tertiary)]';

  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-medium text-[var(--text)] mb-1 block">{label}</label>
      )}
      <div className="space-y-2">
        {entries.map(([key, val], index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={key}
              onChange={(e) => handleKeyChange(key, e.target.value)}
              placeholder={keyPlaceholder}
              className={inputClass}
            />
            <input
              type="text"
              value={val}
              onChange={(e) => handleValueChange(key, e.target.value)}
              placeholder={valuePlaceholder}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => handleRemove(key)}
              className="text-[var(--text-secondary)] hover:text-[var(--red)] text-sm px-1 flex-shrink-0 cursor-pointer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
      >
        + Add header
      </button>
    </div>
  );
}
