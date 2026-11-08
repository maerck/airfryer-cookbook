"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  erro: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { erro: null };

  static getDerivedStateFromError(erro: Error): ErrorBoundaryState {
    return { erro };
  }

  reset = () => this.setState({ erro: null });

  render() {
    if (this.state.erro !== null) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-100 px-6 text-center dark:bg-stone-950">
          <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
          <p className="text-lg text-stone-700 dark:text-stone-200">
            🥲 Não foi possível carregar as receitas.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
