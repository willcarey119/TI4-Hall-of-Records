import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <main style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 16px' }}>
          <p
            className="font-mono text-xs text-accent"
            style={{ marginBottom: '8px' }}
          >
            Something went wrong.
          </p>
          <p
            className="font-mono text-ink-3"
            style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Try refreshing the page.
          </p>
        </main>
      );
    }
    return this.props.children;
  }
}
