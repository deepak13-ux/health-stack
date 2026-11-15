import { Component } from "react";
import { Button } from "./ui.jsx";

// Friendly fallback for rendering errors; no stack trace in the product UI.
export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    console.error(error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="bg-white border border-line rounded-2xl p-6 max-w-lg space-y-3">
        <h1 className="text-lg font-semibold">This view couldn't be displayed.</h1>
        <p className="text-muted">An unexpected problem occurred while showing this page. Your records are unchanged.</p>
        <Button onClick={() => this.setState({ failed: false })}>Reload view</Button>
      </div>
    );
  }
}
