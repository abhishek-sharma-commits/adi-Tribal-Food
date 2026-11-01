import { Share2 } from 'lucide-react';
import { useState } from 'react';

export default function ShareButton({ title }) {
  const [message, setMessage] = useState('');

  const flash = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 2500);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash('Link copied');
    } catch (err) {
      if (err?.name !== 'AbortError') flash('Could not share. Copy the address from your browser instead.');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={share} className="btn-secondary">
        <Share2 className="h-4 w-4" aria-hidden="true" /> Share
      </button>
      <span role="status" aria-live="polite" className="text-sm text-ink-muted">
        {message}
      </span>
    </div>
  );
}
