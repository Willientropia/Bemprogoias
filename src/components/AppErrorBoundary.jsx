import { Component } from 'react';

// Rede de segurança da aplicação inteira. O FieldErrorBoundary só protege as
// telas internas do app de campo; sem esta camada, uma falha no login, no
// painel do gestor ou no roteador deixa a tela em branco no Android, sem
// nenhuma saída para o usuário.
const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    alignContent: 'center',
    gap: 14,
    padding: 24,
    textAlign: 'center',
    background: '#f8f8f6',
    color: '#16331c',
    fontFamily: 'system-ui, sans-serif'
  },
  title: { margin: 0, fontSize: 24 },
  text: { maxWidth: 320, margin: 0, color: '#6b7669' },
  button: {
    width: 'min(100%, 320px)',
    padding: '14px 18px',
    borderRadius: 14,
    border: 0,
    background: '#1f5130',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer'
  },
  details: { width: 'min(100%, 320px)', color: '#6b7669', fontSize: 11 },
  code: {
    display: 'block',
    overflowWrap: 'anywhere',
    marginTop: 8,
    padding: 10,
    borderRadius: 9,
    color: '#87352e',
    background: '#fff0ee',
    textAlign: 'left',
    whiteSpace: 'pre-wrap'
  }
};

export class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Falha geral do aplicativo.', error, info);
    try {
      localStorage.setItem('bem-pro-goias:last-app-error', JSON.stringify({
        message: error?.message || String(error),
        componentStack: info?.componentStack || '',
        occurredAt: new Date().toISOString()
      }));
    } catch {
      // O aviso de recuperação não depende de conseguir guardar o diagnóstico.
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={styles.wrapper} role="alert">
        <h1 style={styles.title}>O aplicativo precisa ser reiniciado</h1>
        <p style={styles.text}>Seus cadastros continuam salvos neste aparelho. Reinicie para voltar ao trabalho.</p>
        <button type="button" style={styles.button} onClick={() => window.location.reload()}>
          Reiniciar aplicativo
        </button>
        <details style={styles.details}>
          <summary>Detalhes para suporte</summary>
          <code style={styles.code}>{this.state.error?.message || 'Erro desconhecido'}</code>
        </details>
      </div>
    );
  }
}
