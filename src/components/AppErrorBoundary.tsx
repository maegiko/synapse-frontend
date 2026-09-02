import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { UnexpectedErrorPage } from '../pages/UnexpectedErrorPage'

/**
 * The app's last line of defence, so a failure in route content or a provider
 * still ends on a page the visitor can act on. React routes only rendering and
 * lifecycle errors here; a failed request is reported by the page that made it.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Synapse caught an unexpected rendering error:', error, info.componentStack)
    }
  }

  render() {
    return this.state.failed ? <UnexpectedErrorPage /> : this.props.children
  }
}
