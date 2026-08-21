import { CloseIcon } from '../icons.jsx';

export default function ImageModal({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6,6,8,0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="icon-btn"
        style={{ position: 'fixed', top: 20, right: 20, background: 'var(--surface)' }}
      >
        <CloseIcon />
      </button>
      <img
        src={src}
        alt="Attachment expanded"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '86vh', borderRadius: 10, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      />
    </div>
  );
}
