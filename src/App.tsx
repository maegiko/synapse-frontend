import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { GuestRoute, ProtectedRoute } from './components/RouteGuards'
import { ProtectedPageTitle } from './components/ProtectedPageTitle'
import { ScrollToTop } from './components/ScrollToTop'
import { StreakCelebrationProvider } from './components/StreakCelebration'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { DashboardPage } from './pages/DashboardPage'
import { DeckPage } from './pages/DeckPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import { GroupsPage } from './pages/GroupsPage'
import { LandingPage } from './pages/LandingPage'
import { LibraryPage } from './pages/LibraryPage'
import { LoginPage } from './pages/LoginPage'
import { NewDeckPage } from './pages/NewDeckPage'
import { NewNotePage } from './pages/NewNotePage'
import { NewQuizPage } from './pages/NewQuizPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { NotePage } from './pages/NotePage'
import { PlayDeckPage } from './pages/PlayDeckPage'
import { PlayQuizPage } from './pages/PlayQuizPage'
import { ProfilePage } from './pages/ProfilePage'
import { QuizPage } from './pages/QuizPage'
import { QuizScoresPage } from './pages/QuizScoresPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { ErrorTestRoute } from './dev/ErrorTestRoute'
import { queryClient } from './lib/queryClient'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <ProtectedPageTitle />
        <AuthProvider>
          <StreakCelebrationProvider>
            <Routes>
            <Route
              path="/"
              element={
                <GuestRoute>
                  <LandingPage />
                </GuestRoute>
              }
            />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes/new"
              element={
                <ProtectedRoute>
                  <NewNotePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes/:noteId"
              element={
                <ProtectedRoute>
                  <NotePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flashcards/new"
              element={
                <ProtectedRoute>
                  <NewDeckPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flashcards/:deckId"
              element={
                <ProtectedRoute>
                  <DeckPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flashcards/:deckId/play"
              element={
                <ProtectedRoute>
                  <PlayDeckPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/new"
              element={
                <ProtectedRoute>
                  <NewQuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:quizId"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:quizId/scores"
              element={
                <ProtectedRoute>
                  <QuizScoresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:quizId/play"
              element={
                <ProtectedRoute>
                  <PlayQuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/library"
              element={
                <ProtectedRoute>
                  <LibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <GroupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId"
              element={
                <ProtectedRoute>
                  <GroupDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <Navigate to="/library?type=notes" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flashcards"
              element={
                <ProtectedRoute>
                  <Navigate to="/library?type=decks" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <Navigate to="/library?type=quizzes" replace />
                </ProtectedRoute>
              }
            />
            {import.meta.env.DEV && <Route path="/__error-test" element={<ErrorTestRoute />} />}
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </StreakCelebrationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
