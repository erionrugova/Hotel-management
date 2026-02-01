import React from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service in production
    if (process.env.NODE_ENV === "production") {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 rounded-lg shadow-xl p-8 border border-slate-800">
            <div className="flex items-center gap-4 mb-6">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Something went wrong
                </h1>
                <p className="text-slate-400 mt-1">
                  We're sorry, but something unexpected happened.
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-slate-800 rounded border border-slate-700">
                <p className="text-red-400 font-mono text-sm mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-slate-400 cursor-pointer text-sm">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-slate-500 overflow-auto max-h-64">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Go to Homepage
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
