import { useEffect } from 'react';
import { toDisplayText } from '../../../utils/normalizers';
import { Icon } from './Icon';

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, toast.persistent ? 8000 : 4200);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.type || 'info'}`} role="status">
      <span className="toast__icon"><Icon name={toast.type === 'error' ? 'alert' : 'check'} size={18} /></span>
      <span>{toDisplayText(toast.message) || 'Aviso do aplicativo.'}</span>
      <button className="icon-button" onClick={onClose} aria-label="Fechar aviso"><Icon name="close" size={17} /></button>
    </div>
  );
}
