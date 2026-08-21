import { useEffect, useState } from 'react';
import { api } from '../api.js';
import EntryForm from './EntryForm.jsx';
import EntryCard from './EntryCard.jsx';
import FilterBar from './FilterBar.jsx';
import ImageModal from './ImageModal.jsx';
import { PlusIcon, LogOutIcon } from '../icons.jsx';

export default function Feed({ onLogout }) {
  const [entries, setEntries] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [composing, setComposing] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [filters, setFilters] = useState({ tag: '', from: '', to: '', q: '' });

  async function loadTags() {
    setAllTags(await api.listTags());
  }

  async function loadEntries() {
    setLoading(true);
    setError('');
    try {
      const params = {
        tag: filters.tag,
        from: filters.from ? `${filters.from}T00:00:00.000Z` : '',
        to: filters.to ? `${filters.to}T23:59:59.999Z` : '',
        q: filters.q,
      };
      setEntries(await api.listEntries(params));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadEntries, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function handleCreateTag(name) {
    const tag = await api.createTag(name);
    setAllTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))));
  }

  async function handleCreate(data) {
    await api.createEntry(data);
    setComposing(false);
    await loadEntries();
  }

  function handleUpdated(updated) {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }

  function handleDeleted(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div style={{ minHeight: '100dvh' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(13,13,15,0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1 style={{ fontSize: 26 }}>Timeline</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" onClick={onLogout} aria-label="Log out">
              <LogOutIcon width={16} height={16} />
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {composing ? (
          <EntryForm allTags={allTags} onCreateTag={handleCreateTag} onSubmit={handleCreate} onCancel={() => setComposing(false)} />
        ) : (
          <button
            className="btn"
            onClick={() => setComposing(true)}
            style={{ justifyContent: 'center', padding: '14px', fontSize: 15, color: 'var(--text-muted)' }}
          >
            <PlusIcon width={16} height={16} /> Log what happened…
          </button>
        )}

        <FilterBar allTags={allTags} filters={filters} setFilters={setFilters} />

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

        {loading && entries.length === 0 ? (
          <p style={{ color: 'var(--text-faint)', textAlign: 'center', padding: '40px 0' }}>Loading…</p>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-faint)' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, marginBottom: 6 }}>Nothing here yet</p>
            <p style={{ fontSize: 14 }}>Log a policy, decision, issue, or discussion above.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              allTags={allTags}
              onCreateTag={handleCreateTag}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onExpandImage={setExpandedImage}
            />
          ))
        )}
      </main>

      <ImageModal src={expandedImage} onClose={() => setExpandedImage(null)} />
    </div>
  );
}
