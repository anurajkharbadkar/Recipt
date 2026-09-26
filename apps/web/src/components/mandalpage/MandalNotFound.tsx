'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-warm-paper)',
    padding: 'var(--space-xl)',
    textAlign: 'center' as const,
  },
  inner: {
    maxWidth: '420px',
  },
  eyebrow: {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-text-subtle)',
    marginBottom: 'var(--space-md)',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--text-3xl)',
    fontWeight: 400,
    color: 'var(--color-ink)',
    lineHeight: 1.15,
    marginBottom: 'var(--space-md)',
  },
  description: {
    fontSize: 'var(--text-base)',
    color: 'var(--color-text-muted)',
    lineHeight: 1.6,
    marginBottom: 'var(--space-xl)',
  },
  slug: {
    fontFamily: 'monospace',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-sindoor)',
    backgroundColor: 'rgba(122, 24, 48, 0.06)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
  },
};

export default function MandalNotFound({ slug }: { slug?: string }) {
  const { t } = useLanguage();

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        <p style={styles.eyebrow}>404</p>
        <h1 style={styles.title}>
          Mandal Not Found
        </h1>
        <p style={styles.description}>
          The Mandal page{' '}
          {slug && <code style={styles.slug}>/mandal/{slug}</code>}{' '}
          does not exist yet. Please check the URL or explore our available Mandals.
        </p>
        <Link href="/" className="btn btn--primary">
          ← {t('home', 'Back to Home')}
        </Link>
      </div>
    </div>
  );
}
