/**
 * Verification only, and never a feature.
 *
 * Rendering this throws, which is the one thing a React error boundary reacts
 * to, so it is how {@link AppErrorBoundary} gets checked by hand during local
 * development. App mounts its `/__error-test` route inside an
 * `import.meta.env.DEV` guard, which Vite replaces with `false` in a build, so
 * both the route and this module drop out of production output.
 */
export function ErrorTestRoute(): never {
  throw new Error('Deliberate error from the development-only /__error-test route.')
}
