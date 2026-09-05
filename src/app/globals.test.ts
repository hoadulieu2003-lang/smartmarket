import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-inter' }),
  Roboto_Mono: () => ({ variable: '--font-mono' }),
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));

import RootLayout, { metadata } from './layout';

describe('document metadata', () => {
  it('exposes the Vietnamese Smartmarket title and document language', () => {
    render(React.createElement(RootLayout, null, React.createElement('main', null, 'Test content')));

    expect(metadata.title).toBe('Smartmarket — Trung tâm điều hành chợ');
    expect(document.documentElement.lang).toBe('vi');
  });
});
