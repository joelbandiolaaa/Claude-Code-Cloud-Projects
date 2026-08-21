import { useState } from 'react';
import { PlusIcon } from '../icons.jsx';

export default function TagPicker({ allTags, selected, onToggle, onCreateTag }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  async function submitNew(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onCreateTag(trimmed);
    setName('');
    setCreating(false);
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {allTags.map((tag) => {
        const active = selected.includes(tag.name);
        return (
          <button
            type="button"
            key={tag.id}
            onClick={() => onToggle(tag.name)}
            className="btn"
            style={{
              padding: '6px 14px',
              fontSize: 13,
              background: active ? tag.color + '26' : 'var(--surface-raised)',
              borderColor: active ? tag.color : 'var(--border)',
              color: active ? tag.color : 'var(--text-muted)',
            }}
          >
            {tag.name}
          </button>
        );
      })}

      {creating ? (
        <form onSubmit={submitNew} style={{ display: 'flex', gap: 6 }}>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => !name && setCreating(false)}
            placeholder="New tag"
            style={{ padding: '6px 10px', fontSize: 13, width: 120 }}
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="btn"
          style={{ padding: '6px 12px', fontSize: 13, color: 'var(--text-muted)' }}
        >
          <PlusIcon width={14} height={14} /> Tag
        </button>
      )}
    </div>
  );
}
