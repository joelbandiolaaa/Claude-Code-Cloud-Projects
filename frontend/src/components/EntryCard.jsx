import { useState } from 'react';
import { EditIcon, TrashIcon } from '../icons.jsx';
import { api } from '../api.js';
import EntryForm from './EntryForm.jsx';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function EntryCard({ entry, allTags, onCreateTag, onUpdated, onDeleted, onExpandImage }) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (editing) {
    return (
      <EntryForm
        allTags={allTags}
        onCreateTag={onCreateTag}
        initialEntry={entry}
        onCancel={() => setEditing(false)}
        onSubmit={async (data) => {
          const updated = await api.updateEntry(entry.id, data);
          onUpdated(updated);
          setEditing(false);
        }}
      />
    );
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.deleteEntry(entry.id);
      onDeleted(entry.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 20,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <time
          dateTime={entry.occurred_at}
          style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text)' }}
        >
          {formatDate(entry.occurred_at)}
        </time>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Edit entry">
            <EditIcon width={15} height={15} />
          </button>
          {confirmingDelete ? (
            <button
              className="btn btn-danger"
              style={{ padding: '6px 12px', fontSize: 13 }}
              onClick={confirmDelete}
              disabled={deleting}
              onBlur={() => setConfirmingDelete(false)}
              autoFocus
            >
              {deleting ? 'Deleting…' : 'Confirm delete'}
            </button>
          ) : (
            <button className="icon-btn" onClick={() => setConfirmingDelete(true)} aria-label="Delete entry">
              <TrashIcon width={15} height={15} />
            </button>
          )}
        </div>
      </div>

      {entry.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {entry.tags.map((tag) => (
            <span
              key={tag.id}
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: '3px 10px',
                borderRadius: 999,
                color: tag.color,
                background: tag.color + '1f',
                border: `1px solid ${tag.color}40`,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <p style={{ marginTop: 14, whiteSpace: 'pre-wrap', color: 'var(--text)', fontSize: 15, lineHeight: 1.65 }}>
        {entry.body}
      </p>

      {entry.attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          {entry.attachments.map((att) => (
            <button
              key={att.id}
              onClick={() => onExpandImage(api.attachmentUrl(att.id))}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Expand attachment"
            >
              <img
                src={api.attachmentUrl(att.id)}
                alt="Entry attachment"
                style={{
                  width: 100,
                  height: 100,
                  objectFit: 'cover',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
