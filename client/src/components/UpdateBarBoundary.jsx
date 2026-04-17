import React from "react";

// Narrow error boundary around the UpdateBar. If anything in the update UI
// throws during render (e.g. an unexpected Chakra/IPC edge case) we silently
// drop the banner instead of white-screening the entire application. The
// main window keeps working and auto-update still happens in the background;
// the user just won't see the visual progress.
class UpdateBarBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log to the renderer console so it is captured by Electron devtools /
    // any remote logging that's wired up. Never re-throw.
    // eslint-disable-next-line no-console
    console.error("[UpdateBarBoundary] Update UI crashed:", error, info);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default UpdateBarBoundary;
