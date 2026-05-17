'use client';

import { useEffect, useState } from 'react';
import { Share2, Copy, Check, X, Eye, ExternalLink, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isDemoMode } from '@/lib/demo-mode';

interface ShareDialogProps {
  analysisId: string;
  open: boolean;
  onClose: () => void;
  initialShareToken?: string | null;
  initialShareEnabled?: boolean;
  initialShareViews?: number;
  initialLastViewedAt?: string | null;
}

interface ShareStatus {
  share_token: string | null;
  share_enabled: boolean;
  share_views: number;
  last_viewed_at: string | null;
}

export function ShareDialog({
  analysisId,
  open,
  onClose,
  initialShareToken,
  initialShareEnabled,
  initialShareViews,
  initialLastViewedAt,
}: ShareDialogProps) {
  const [status, setStatus] = useState<ShareStatus>({
    share_token: initialShareToken || null,
    share_enabled: initialShareEnabled || false,
    share_views: initialShareViews || 0,
    last_viewed_at: initialLastViewedAt || null,
  });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (isDemoMode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/analyses/${analysisId}/share`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setStatus(data);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, analysisId]);

  if (!open) return null;

  const shareUrl =
    status.share_token && status.share_enabled
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${status.share_token}`
      : '';

  async function enable() {
    setBusy(true);
    setError(null);
    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 400));
      setStatus({
        share_token: status.share_token || 'demo-mock-1',
        share_enabled: true,
        share_views: status.share_views || 0,
        last_viewed_at: status.last_viewed_at,
      });
      setBusy(false);
      return;
    }
    try {
      const res = await fetch(`/api/analyses/${analysisId}/share`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to enable sharing');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!confirm('Revoke this link? Anyone with the URL will lose access.')) return;
    setBusy(true);
    setError(null);
    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 300));
      setStatus({ ...status, share_enabled: false });
      setBusy(false);
      return;
    }
    try {
      const res = await fetch(`/api/analyses/${analysisId}/share`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke link');
      setStatus({ ...status, share_enabled: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy. Please copy manually.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Share with client</h2>
              <p className="text-xs text-gray-500">A public, branded report link</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!status.share_enabled ? (
          <>
            <p className="mb-4 text-sm text-gray-600">
              Generate a private, unguessable link your client can open on any device. Their view
              hides your private notes, marketing tips, and agent strategy.
            </p>
            <div className="mb-4 rounded-lg bg-brand-50 p-3 text-xs text-brand-800">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <div>
                  The client sees a clean, mobile-friendly report with your branding name on top —
                  perfect for texting between showings.
                </div>
              </div>
            </div>
            <Button onClick={enable} loading={busy} className="w-full">
              <Share2 className="h-4 w-4" />
              Generate share link
            </Button>
          </>
        ) : (
          <>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Shareable link
            </p>
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 p-2">
              <input
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 bg-transparent px-2 text-xs text-gray-700 outline-none"
              />
              <Button onClick={copy} size="sm" variant={copied ? 'secondary' : 'primary'}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 text-xs">
              <div>
                <p className="text-gray-500">Views</p>
                <p className="flex items-center gap-1 font-semibold text-gray-900">
                  <Eye className="h-3.5 w-3.5 text-brand-500" />
                  {status.share_views || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last viewed</p>
                <p className="font-semibold text-gray-900">
                  {status.last_viewed_at
                    ? new Date(status.last_viewed_at).toLocaleString()
                    : 'Not yet'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                Preview as client
              </a>
              <Button onClick={revoke} variant="danger" loading={busy}>
                <Trash2 className="h-4 w-4" />
                Revoke
              </Button>
            </div>
          </>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        )}

        {isDemoMode && (
          <p className="mt-3 text-center text-xs text-gray-400">
            Demo mode — link works locally. Connect Supabase for real sharing.
          </p>
        )}
      </div>
    </div>
  );
}
