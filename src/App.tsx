import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { GuestRoute, ProtectedRoute } from './components/RouteGuards'
import { ScrollToTop } from './components/ScrollToTop'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { LibraryPage } from './pages/LibraryPage'
import { LoginPage } from './pages/LoginPage'
import { NewDeckPage } from './pages/NewDeckPage'
import { NewNotePage } from './pages/NewNotePage'
import { NewQuizPage } from './pages/NewQuizPage'
import { NotePage } from './pages/NotePage'
import { RegisterPage } from './pages/RegisterPage'
import { queryClient } from './lib/queryClient'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
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
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
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
              path="/quiz/new"
              element={
                <ProtectedRoute>
                  <NewQuizPage />
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
              path="/notes"
              element={
                <ProtectedRoute>
                  <ComingSoonPage
                    title="Your notes"
                    body="The full list of summarized notes, with search and detail views, lands here next."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flashcards"
              element={
                <ProtectedRoute>
                  <ComingSoonPage
                    title="Your flashcard decks"
                    body="The full list of decks, plus studying a deck card by card, lands here next."
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <ComingSoonPage
                    title="Your quizzes"
                    body="The full list of quizzes, plus running one and saving a score, lands here next."
                  />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
