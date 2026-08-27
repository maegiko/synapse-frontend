import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { IconArrowRight } from '../components/icons'
import { shell, surfaceCard } from '../components/ui'

interface ComingSoonPageProps {
  title: string
  body: string
}

/** Destination for the dashboard's action cards until each flow is built. */
export function ComingSoonPage({ title, body }: ComingSoonPageProps) {
  return (
    <>
      <AppHeader />

      <main className={`${shell} pt-12 pb-20`}>
        <div className={`${surfaceCard} max-w-150 p-8`}>
          <h1 className="text-2xl">{title}</h1>
          <p className="mt-3 text-base text-text-muted">{body}</p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-accent-solid no-underline hover:underline"
          >
            Back to dashboard
            <IconArrowRight />
          </Link>
        </div>
      </main>
    </>
  )
}
