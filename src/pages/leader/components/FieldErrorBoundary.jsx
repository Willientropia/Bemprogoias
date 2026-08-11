import { Component } from 'react';
import { Icon } from './Icon';

export class FieldErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error, info) {
    console.error('Falha na tela do aplicativo de campo.', error, info);
    try {
      localStorage.setItem('bem-pro-goias:last-screen-error', JSON.stringify({
        message: error?.message || String(error),
        componentStack: info?.componentStack || '',
        occurredAt: new Date().toISOString()
      }));
    } catch {
      // A recuperação da tela não depende do armazenamento do diagnóstico.
    }
  }

  // A rota precisa mudar antes de limpar o erro: se a mesma tela quebrada for
  // renderizada de novo, o líder volta para o mesmo aviso e fica preso nele.
  recover = () => {
    this.props.onRecover?.();
    this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="page fatal-state" role="alert">
        <span><Icon name="alert" size={30} /></span>
        <h1>Não foi possível abrir esta tela</h1>
        <p>O aplicativo protegeu seus dados. Volte para a lista e tente novamente.</p>
        <button type="button" className="button button--primary" onClick={this.recover}>
          Voltar para os eleitores
        </button>
        <button type="button" className="button button--ghost" onClick={() => window.location.reload()}>
          Reiniciar aplicativo
        </button>
        <details className="fatal-state__details">
          <summary>Detalhes para suporte</summary>
          <code>{this.state.error?.message || 'Erro desconhecido'}</code>
        </details>
      </section>
    );
  }
}
