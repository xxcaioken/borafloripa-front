import React from 'react';

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-icon">⚡</div>
          <h2>Algo deu errado</h2>
          <p>Recarregue a página para continuar.</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
