import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import synapseLogo from '../assets/synapse_logo.webp'
import { shell } from '../components/ui'

const TITLE = 'Privacy policy - Synapse'
const LAST_UPDATED = '6 September 2026'
const CONTACT_EMAIL = 'privacy@studysynapse.app'

/**
 * The privacy policy, at a fixed public address.
 *
 * <p>Public and unguarded on purpose: Google fetches this URL when the OAuth
 * consent screen is published, and a signed-out visitor has to be able to read it
 * before deciding to create an account.</p>
 */
export function PrivacyPage() {
  useEffect(() => {
    const previous = document.title
    document.title = TITLE
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <main className={`${shell} max-w-180`}>
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 font-display text-lg font-medium text-text no-underline"
        >
          <img src={synapseLogo} alt="" width="44" height="44" decoding="async" className="h-10 w-10" />
          <span className="translate-y-0.5">Synapse</span>
        </Link>

        <h1 className="mt-8 text-3xl text-balance sm:text-4xl">Privacy policy</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated {LAST_UPDATED}</p>

        <p className="mt-6 text-base text-pretty text-text-muted">
          Synapse turns study notes you upload into summaries, flashcards and quizzes. This page
          describes exactly what it stores about you, who else sees it, and how long it is kept.
        </p>

        <Section title="What Synapse stores">
          <p>
            <strong className="font-bold text-text">Your account.</strong> Your full name, email
            address and time zone, plus a way to sign you in: a bcrypt hash of your password, an
            identifier for your Google Account, or both. Your password itself is never stored, and
            neither is anything that could be turned back into it.
          </p>
          <p>
            <strong className="font-bold text-text">What you create.</strong> The summaries,
            flashcard decks, quizzes, saved quiz scores, study groups and daily study activity that
            come out of the material you upload.
          </p>
          <p>
            <strong className="font-bold text-text">Sign-in records.</strong> Hashed session tokens,
            and hashed single-use tokens behind the links sent for email verification, email changes
            and password resets. Only the hashes are stored, so a copy of the database would not let
            somebody sign in as you.
          </p>
          <p>
            The file you upload is not kept. Its text is extracted, used to generate your study
            material, and discarded; only the generated result is saved.
          </p>
        </Section>

        <Section title="Who else sees it">
          <p>
            Synapse relies on a small number of other services, and each one sees only what it needs
            to do its job.
          </p>
          <ul className="grid gap-2.5 pl-5 [list-style:disc]">
            <li>
              <strong className="font-bold text-text">Groq</strong> generates your summaries,
              flashcards and quizzes. The text extracted from the documents you upload is sent
              there. If a document contains something you would not want a third party to process,
              do not upload it.
            </li>
            <li>
              <strong className="font-bold text-text">Resend</strong> delivers Synapse's email. It
              receives your email address and the contents of those messages.
            </li>
            <li>
              <strong className="font-bold text-text">Google</strong>, only if you choose "Continue
              with Google" or link a Google Account. See below.
            </li>
            <li>
              <strong className="font-bold text-text">PostHog</strong> counts how often a handful of
              named actions happen, such as a note being created. No profile is built, you are never
              identified to it, and nothing about you or your study material is attached to those
              counts.
            </li>
            <li>
              <strong className="font-bold text-text">Northflank</strong> hosts the application and
              its database, and <strong className="font-bold text-text">Cloudflare Pages</strong>{' '}
              serves the website.
            </li>
          </ul>
          <p>
            Your account details and study material are not sold, rented, or shared with anyone
            else, and are not used to advertise to you.
          </p>
        </Section>

        <Section title="Signing in with Google">
          <p>
            Google sign-in is optional. Synapse works exactly the same with an email address and a
            password.
          </p>
          <p>
            If you use it, Google tells Synapse a permanent identifier for your Google Account, your
            email address, whether Google has confirmed that address, your name, and your Google
            Workspace domain if you have one. That is all. Synapse never sees your Google password
            and has no access to your Gmail, Drive, contacts, or anything else in your Google
            Account.
          </p>
          <p>
            Your Synapse email address is yours to change afterwards, and doing so does not affect
            your Google sign-in. If you have set a Synapse password you can unlink Google at any
            time from your profile, and your account and everything in it stay exactly as they are.
          </p>
        </Section>

        <Section title="Addresses and logs">
          <p>
            Your network address is used to limit how often sign-in, registration and email requests
            can be made from one place, which is what keeps the service usable and stops abuse. It
            is held briefly in memory for that purpose and is never written to the database.
          </p>
        </Section>

        <Section title="How long it is kept">
          <p>
            Your account and your study material are kept for as long as your account exists.
            Deleting your account deletes everything attached to it: notes, decks, quizzes, scores,
            groups, activity history and sessions.
          </p>
          <p>
            An account that is created but never confirms its email address is deleted
            automatically after seven days. Expired sign-in and verification tokens are deleted on a
            schedule.
          </p>
          <p>
            Synapse does not yet have a delete-my-account button. Email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent-foreground">
              {CONTACT_EMAIL}
            </a>{' '}
            and your account and its contents will be removed.
          </p>
        </Section>

        <Section title="Keeping it safe">
          <p>
            Traffic is encrypted in transit. Passwords are hashed with bcrypt, and session and email
            tokens are stored only as hashes. Access to the application expires quickly and is
            renewed by a token held in a cookie your browser will not hand to other sites. Every
            request for your notes, decks and quizzes is checked against the account that owns them.
          </p>
          <p>
            No service can promise perfect security, and Synapse is a personal project rather than
            an audited commercial product. Please keep that in mind when deciding what to upload.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can change your name and time zone, move your account to a different email address,
            set or change your password, link or unlink Google, and delete any note, deck, quiz or
            group, all from inside Synapse. To get a copy of your data or to delete your account
            entirely, email the address below.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If this policy changes, the date at the top of the page changes with it. A change that
            materially affects what happens to your data will be announced in the application rather
            than made quietly.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about any of this can go to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent-foreground">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <p className="mt-12 text-sm">
          <Link to="/" className="font-semibold text-accent-foreground no-underline hover:underline">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-xl sm:text-2xl">{title}</h2>
      <div className="mt-3 grid gap-3.5 text-base text-pretty text-text-muted">{children}</div>
    </section>
  )
}
