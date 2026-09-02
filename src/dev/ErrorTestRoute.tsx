/**
 * Verification only. Rendering this throws, which is how {@link AppErrorBoundary}
 * gets checked by hand. Its route is behind an `import.meta.env.DEV` guard, so
 * both the route and this module drop out of a build.
 */
export function ErrorTestRoute(): never {
  throw new Error('Deliberate error from the development-only /__error-test route.')
}
