import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from '../../src/components/AppErrorBoundary';

function Boom() {
  throw new Error('falha inesperada no roteador');
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('mostra a saída de recuperação em vez de deixar a tela em branco', () => {
    render(<AppErrorBoundary><Boom /></AppErrorBoundary>);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /precisa ser reiniciado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reiniciar aplicativo' })).toBeInTheDocument();
    expect(screen.getByText('falha inesperada no roteador')).toBeInTheDocument();
  });

  it('guarda o diagnóstico para o suporte', () => {
    render(<AppErrorBoundary><Boom /></AppErrorBoundary>);

    const stored = JSON.parse(localStorage.getItem('bem-pro-goias:last-app-error'));
    expect(stored.message).toBe('falha inesperada no roteador');
    expect(stored.occurredAt).toBeTruthy();
  });

  it('não interfere quando não há erro', () => {
    render(<AppErrorBoundary><p>conteúdo normal</p></AppErrorBoundary>);

    expect(screen.getByText('conteúdo normal')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
