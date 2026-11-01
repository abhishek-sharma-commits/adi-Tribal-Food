import { X } from 'lucide-react';
import { useState } from 'react';

/** Free-form tags: Enter or comma adds, Backspace on an empty box removes the last. Lower-cased, max 10, max 30 chars each. */
export default function TagInput({ id, value, onChange, disabled }) {
  const [text, setText] = useState('');
  const [problem, setProblem] = useState('');

  const add = (raw) => {
    const tag = raw.trim().toLowerCase().replace(/^#/, '');
    if (!tag) return;
    if (tag.length > 30) return setProblem('A tag can be up to 30 characters.');
    if (value.includes(tag)) return setText('');
    if (value.length >= 10) return setProblem('You can add up to 10 tags.');
    setProblem('');
    onChange([...value, tag]);
    setText('');
  };

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="Tags">
          {value.map((t) => (
            <li key={t} className="inline-flex items-center gap-1 rounded-full bg-surface py-1 pl-3 pr-1 text-sm">
              #{t}
              <button type="button" disabled={disabled} onClick={() => onChange(value.filter((x) => x !== t))} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white" aria-label={`Remove tag ${t}`}>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        value={text}
        disabled={disabled}
        onChange={(e) => (setText(e.target.value), setProblem(''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') (e.preventDefault(), add(text));
          else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => add(text)}
        placeholder="Type a tag and press Enter"
        className="input"
      />
      {problem && (
        <p className="field-error" role="alert">
          {problem}
        </p>
      )}
    </div>
  );
}
