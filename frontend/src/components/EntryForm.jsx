import { useRef, useState } from 'react';
import TagPicker from './TagPicker.jsx';
import { ImageIcon, XCircleIcon } from '../icons.jsx';
import { api } from '../api.js';

function toLocalInputValue(iso) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve({ mime: file.type || 'image/png', data: base64, previewUrl: dataUrl });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EntryForm({ allTags, onCreateTag, initialEntry, onSubmit, onCancel }) {
  const isEdit = !!initialEntry;
  const [body, setBody] = useState(initialEntry?.body || '');
  const [occurredAt, setOccurredAt] = useState(toLocalInputValue(initialEntry?.occurred_at));
  const [tags, setTags] = useState(initialEntry?.tags?.map((t) => t.name) || []);
  const [existingAttachments, setExistingAttachments] = useState(initialEntry?.attachments || []);
  const [newAttachments, setNewAttachments] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  function toggleTag(name) {
    setTags((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  }

  async function handleFiles(files) {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const converted = await Promise.all(images.map(fileToAttachment));
    setNewAttachments((prev) => [...prev, ...converted]);
  }

  function handlePaste(e) {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter((it) => it.type.startsWith('image/'));
    if (imageItems.length) {
      handleFiles(imageItems.map((it) => it.getAsFile()).filter(Boolean));
    }
  }

  async function removeExisting(id) {
    await api.deleteAttachment(id);
    setExistingAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function removeNew(idx) {
    setNewAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) {
      setError('Write something before saving.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit({
        occurred_at: new Date(occurredAt).toISOString(),
        body,
        tags,
        attachments: newAttachments.map(({ mime, data }) => ({ mime, data })),
      });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      onPaste={handlePaste}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What happened? Policy update, decision made, discussion notes…"
        rows={4}
        style={{ resize: 'vertical', fontSize: 15, lineHeight: 1.6 }}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          style={{ fontSize: 13, padding: '8px 10px' }}
        />
        <button
          type="button"
          className="btn"
          style={{ fontSize: 13, padding: '8px 12px' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon width={15} height={15} /> Attach image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>or paste a screenshot</span>
      </div>

      {(existingAttachments.length > 0 || newAttachments.length > 0) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {existingAttachments.map((a) => (
            <div key={`existing-${a.id}`} style={{ position: 'relative' }}>
              <img
                src={api.attachmentUrl(a.id)}
                alt="Attachment"
                style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
              />
              <button
                type="button"
                onClick={() => removeExisting(a.id)}
                style={{ position: 'absolute', top: -6, right: -6, background: 'var(--bg)', borderRadius: 999, color: 'var(--danger)', border: 'none', display: 'flex' }}
              >
                <XCircleIcon width={18} height={18} />
              </button>
            </div>
          ))}
          {newAttachments.map((a, idx) => (
            <div key={`new-${idx}`} style={{ position: 'relative' }}>
              <img
                src={a.previewUrl}
                alt="New attachment"
                style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
              />
              <button
                type="button"
                onClick={() => removeNew(idx)}
                style={{ position: 'absolute', top: -6, right: -6, background: 'var(--bg)', borderRadius: 999, color: 'var(--danger)', border: 'none', display: 'flex' }}
              >
                <XCircleIcon width={18} height={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <TagPicker allTags={allTags} selected={tags} onToggle={toggleTag} onCreateTag={onCreateTag} />

      {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Post entry'}
        </button>
      </div>
    </form>
  );
}
