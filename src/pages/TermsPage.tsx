import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import synapseLogo from '../assets/synapse_logo.webp'
import { shell } from '../components/ui'

const TITLE = 'Terms of service - Synapse'
const LAST_UPDATED = '7 September 2026'
const CONTACT_EMAIL = 'kennethk.dev@gmail.com'
const GOVERNING_LAW = 'Australia'

/**
 * The terms of service, at a fixed public address.
 *
 * <p>Public and unguarded for the same reason the privacy policy is: somebody
 * has to be able to read what they are agreeing to before they agree to it, and
 * the register form links here.</p>
 */
export function TermsPage() {
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

        <h1 className="mt-8 text-3xl text-balance sm:text-4xl">Terms of service</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated {LAST_UPDATED}</p>

        <p className="mt-6 text-base text-pretty text-text-muted">
          Synapse turns study notes you upload into summaries, flashcards and quizzes. These terms
          are the agreement between you and Synapse for using it. Creating an account, or using the
          service at all, means you accept them. The{' '}
          <Link to="/privacy" className="font-semibold text-accent-foreground">
            privacy policy
          </Link>{' '}
          covers what happens to your data and forms part of this agreement.
        </p>

        <Section title="Who runs Synapse">
          <p>
            Synapse is built and operated by Kenneth Koon as an independent personal project. It is
            not a company, a school, or a certified education provider, and it is offered free of
            charge. Questions and notices go to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent-foreground">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section title="Your account">
          <p>
            You need an account to use Synapse. Give an email address that is really yours, keep
            your password and your signed-in devices to yourself, and tell us at the address above
            if you think somebody else has got into your account. What happens under your account is
            your responsibility.
          </p>
          <p>
            You must be at least 13 years old to use Synapse. If you are under 16 and in the United
            Kingdom or the European Economic Area, you need a parent or guardian's permission first.
          </p>
          <p>One person, one account. Do not share an account or sign in as somebody else.</p>
        </Section>

        <Section title="What you upload">
          <p>
            You keep ownership of everything you upload and of the study material generated from it.
            Synapse claims none of it.
          </p>
          <p>
            By uploading a file you confirm that you are allowed to. That means you wrote it, you
            own it, it is licensed to you in a way that permits this, or it is otherwise free to
            use. Lecture slides, textbooks, past papers and paid course material usually belong to
            somebody else, and whether you may put them through Synapse is between you and them.
          </p>
          <p>
            You give Synapse permission to store, process and display your material for the single
            purpose of running the service for you. That includes sending the extracted text to the
            providers named in the{' '}
            <Link to="/privacy" className="font-semibold text-accent-foreground">
              privacy policy
            </Link>
            , which is how summaries, decks and quizzes get generated. The permission is limited to
            operating Synapse, it is not exclusive, it earns nobody any money, and it ends when you
            delete the material or your account. Your uploads are never used to train an AI model
            and are never sold or shared for advertising.
          </p>
          <p>
            Do not upload other people's personal information, medical or financial records, or
            anything confidential you were trusted with. Synapse is not built to hold that kind of
            material.
          </p>
        </Section>

        <Section title="Generated study material is not guaranteed to be correct">
          <p>
            Summaries, flashcards and quizzes are produced automatically by an AI model. They will
            sometimes be wrong, incomplete, or confidently misleading, including on points that look
            straightforward. This is a known limit of the technology, not a fault that can be fully
            fixed.
          </p>
          <p>
            Check anything that matters against the source material before you rely on it. Do not
            treat generated output as a substitute for your notes, your course materials, your
            instructor, or professional advice of any kind. Synapse does not promise that any
            output is accurate, complete, or suitable for an exam, an assignment, or a decision.
          </p>
          <p>
            You are also responsible for your own academic integrity. Your school or university sets
            the rules on using AI tools for coursework, and following them is on you.
          </p>
        </Section>

        <Section title="Using Synapse properly">
          <p>Do not:</p>
          <ul className="grid gap-2.5 pl-5 [list-style:disc]">
            <li>upload anything illegal, or anything you have no right to upload</li>
            <li>
              use Synapse to harass anybody, or to produce material intended to deceive or harm
            </li>
            <li>
              try to break, overload, or get around the rate limits, or automate access outside the
              normal interface
            </li>
            <li>
              attempt to reach accounts, data, or parts of the system that are not yours, or probe
              it for weaknesses without asking first
            </li>
            <li>copy, resell, or rebrand the service, or run it as your own</li>
          </ul>
          <p>
            Found a security problem? Email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent-foreground">
              {CONTACT_EMAIL}
            </a>{' '}
            before telling anyone else. Reports made in good faith are welcome.
          </p>
        </Section>

        <Section title="What belongs to Synapse">
          <p>
            The Synapse name, logo, interface, design and code stay with their owner. Using the
            service does not transfer any of that to you, and nothing here grants you a licence to
            reuse it.
          </p>
        </Section>

        <Section title="Availability">
          <p>
            Synapse is a personal project running on modest infrastructure. It is provided as it is,
            with no promise of uptime, and it may be slow, unavailable, or interrupted without
            warning. Features can change or be withdrawn, and the service may be discontinued
            altogether. If it is ever shut down for good, reasonable notice will go to the email
            address on your account so you can copy out what you want to keep.
          </p>
          <p>
            Keep your own copies of anything important. Synapse is not a backup service and no
            promise is made that your material will survive a fault.
          </p>
        </Section>

        <Section title="Ending it">
          <p>
            You can stop using Synapse whenever you like. Deleting your account, from your profile,
            takes everything in it with it straight away and cannot be reversed.
          </p>
          <p>
            Access may be suspended or removed if an account breaks these terms, puts the service or
            its other users at risk, or is being used unlawfully. Where it is reasonable to do so,
            you will be told why and given a chance to put it right first.
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            Synapse is provided "as is" and "as available", without warranties of any kind, whether
            express or implied, including any implied warranty of merchantability, fitness for a
            particular purpose, or non-infringement. No promise is made that the service will be
            uninterrupted, secure, error-free, or that any output will be accurate.
          </p>
          <p>
            Some countries do not allow these exclusions. Where that is the case, the rights the law
            gives you stand, and nothing here takes them away.
          </p>
        </Section>

        <Section title="Liability">
          <p>
            To the fullest extent the law allows, Synapse and its operator are not liable for lost
            or corrupted material, lost study time, missed deadlines, exam or assignment results, or
            for any indirect or consequential loss arising from your use of the service.
          </p>
          <p>
            Nothing in these terms limits liability for death or personal injury caused by
            negligence, for fraud, or for anything else that cannot lawfully be limited.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            These terms may be updated as Synapse changes. The date at the top of the page changes
            with them, and a change that materially affects your rights will be announced in the
            application rather than made quietly. Continuing to use Synapse after a change means you
            accept the updated terms; if you do not, stop using the service and ask for your account
            to be deleted.
          </p>
        </Section>

        <Section title="Governing law">
          <p>
            These terms are governed by the laws of {GOVERNING_LAW}, and its courts have
            jurisdiction over any dispute. If you are a consumer, this does not deprive you of the
            protection of the mandatory laws of the country you live in.
          </p>
          <p>
            If any part of these terms turns out to be unenforceable, the rest of them carry on
            unaffected.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Anything about these terms can go to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-accent-foreground">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <p className="mt-12 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link to="/" className="font-semibold text-accent-foreground no-underline hover:underline">
            Back to home
          </Link>
          <Link
            to="/privacy"
            className="font-semibold text-accent-foreground no-underline hover:underline"
          >
            Privacy policy
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
