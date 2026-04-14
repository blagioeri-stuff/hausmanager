import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '../utils';

describe('normalizeUrl', () => {
  it('prepends https:// to bare domains', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });

  it('prepends https:// to subdomains', () => {
    expect(normalizeUrl('www.gemeinde.ch')).toBe('https://www.gemeinde.ch');
  });

  it('leaves https:// URLs unchanged', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('leaves http:// URLs unchanged', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('is case-insensitive for protocol check', () => {
    expect(normalizeUrl('HTTPS://example.com')).toBe('HTTPS://example.com');
  });

  it('returns empty string unchanged', () => {
    expect(normalizeUrl('')).toBe('');
  });

  it('trims whitespace before processing', () => {
    expect(normalizeUrl('  gemeinde.ch  ')).toBe('https://gemeinde.ch');
  });

  it('trims whitespace from already-valid URLs', () => {
    expect(normalizeUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it('handles paths and query strings', () => {
    expect(normalizeUrl('example.com/path?q=1')).toBe('https://example.com/path?q=1');
  });
});
