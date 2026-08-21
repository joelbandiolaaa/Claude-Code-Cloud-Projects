import { SearchIcon, CalendarIcon, XCircleIcon } from '../icons.jsx';

export default function FilterBar({ allTags, filters, setFilters }) {
  const { tag, from, to, q } = filters;
  const hasActive = tag || from || to || q;

  function update(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <SearchIcon
            width={15}
            height={15}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
          />
          <input
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Search entries…"
            style={{ width: '100%', paddingLeft: 34, fontSize: 14 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <CalendarIcon width={15} height={15} style={{ color: 'var(--text-faint)' }} />
          <input type="date" value={from} onChange={(e) => update({ from: e.target.value })} style={{ fontSize: 13, padding: '8px 10px' }} />
          <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>to</span>
          <input type="date" value={to} onChange={(e) => update({ to: e.target.value })} style={{ fontSize: 13, padding: '8px 10px' }} />
        </div>
        {hasActive && (
          <button
            className="btn"
            style={{ fontSize: 13, padding: '8px 12px' }}
            onClick={() => setFilters({ tag: '', from: '', to: '', q: '' })}
          >
            <XCircleIcon width={14} height={14} /> Clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {allTags.map((t) => {
          const active = tag === t.name;
          return (
            <button
              key={t.id}
              onClick={() => update({ tag: active ? '' : t.name })}
              className="btn"
              style={{
                padding: '5px 12px',
                fontSize: 12,
                background: active ? t.color + '26' : 'var(--surface-raised)',
                borderColor: active ? t.color : 'var(--border)',
                color: active ? t.color : 'var(--text-muted)',
              }}
            >
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
