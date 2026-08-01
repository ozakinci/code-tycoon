import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Safety net for crashes that survive sanitizeGameState (e.g. a bug in the
// sanitizer itself, or a crash unrelated to save data). Without this, a
// render-time throw white-screens the app with no recovery path, since the
// in-app Hard Reset button lives inside Settings, which never gets to render.
export class ErrorBoundary extends Component<Props, State> {
  // Declared explicitly: this project has no @types/react installed (see
  // TICKETS.md BUG-009), so TS can't infer `props`/`state` from the generic
  // Component<Props, State> base — it resolves to an untyped `any`.
  props: Readonly<Props>;
  state: State = { hasError: false };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Code Tycoon crashed:', error, info);
  }

  private handleClearSave = () => {
    localStorage.removeItem('codeTycoonEncryptedSave');
    localStorage.removeItem('codeTycoonSave');
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold text-red-400">Code Tycoon crashed</h1>
          <p className="text-zinc-400 text-sm">
            Something went wrong, most likely a corrupted save. You can reload to try again,
            or clear your save and start fresh.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold"
            >
              Reload
            </button>
            <button
              onClick={this.handleClearSave}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
            >
              Clear Save &amp; Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
