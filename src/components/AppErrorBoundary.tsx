import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { UnexpectedErrorPage } from '../pages/UnexpectedErrorPage'

/**
 * The app's last line of defence, wrapped around everything so a failure in
 * route content, in the providers or in a shared component still ends on a
 * page the visitor can act on rather than a blank screen.
 *
 * React only routes rendering and lifecycle errors here. A failed request or a
 * throw inside a click handler never reaches a boundary, and does not need to:
 * those are already reported in place by the page that made the call, which
 * can keep the rest of itself usable. Nothing about that handling changes.
 *
 * There is no reset action. A boundary that re-renders the same broken tree
 * usually just fails again, so the fallback offers a real reload instead.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // Development only: in a build there is no one at the console to read it,
    // and the visitor is never shown the message either way.
    if (import.meta.env.DEV) {
      console.error('Synapse caught an unexpected rendering error:', error, info.componentStack)
    }
  }

  render() {
    return this.state.failed ? <UnexpectedErrorPage /> : this.props.children
  }
}
