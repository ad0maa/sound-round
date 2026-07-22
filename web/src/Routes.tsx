// In this file, all Page components from 'src/pages` are auto-imported. Nested
// directories are supported, and should be uppercase. Each subdirectory will be
// prepended onto the component name.
//
// Examples:
//
// 'src/pages/HomePage/HomePage.js'         -> HomePage
// 'src/pages/Admin/BooksPage/BooksPage.js' -> AdminBooksPage

import { Router, Route, PrivateSet } from '@cedarjs/router'

import AppLayout from 'src/layouts/AppLayout/AppLayout'

import { useAuth } from './auth.js'

const Routes = () => {
  return (
    <Router useAuth={useAuth}>
      <Route path="/login" page={LoginPage} name="login" />
      <Route path="/signup" page={SignupPage} name="signup" />
      <Route path="/forgot-password" page={ForgotPasswordPage} name="forgotPassword" />
      <Route path="/reset-password" page={ResetPasswordPage} name="resetPassword" />

      {/* Join lives outside the layout: it's the invite-link landing page */}
      <PrivateSet unauthenticated="login">
        <Route path="/join/{code}" page={JoinPage} name="join" />
      </PrivateSet>

      <PrivateSet unauthenticated="login" wrap={AppLayout}>
        <Route path="/" page={HomePage} name="home" />
        <Route path="/leagues" page={LeaguesPage} name="leagues" />
        <Route path="/leagues/new" page={NewLeaguePage} name="newLeague" />
        <Route path="/leagues/{id}" page={LeaguePage} name="league" />
        <Route path="/leagues/{id}/leaderboard" page={LeaderboardPage} name="leaderboard" />
        <Route path="/leagues/{id}/rounds/new" page={NewRoundPage} name="newRound" />
        <Route path="/leagues/{id}/rounds/{roundId}" page={RoundPage} name="round" />
        <Route path="/leagues/{id}/rounds/{roundId}/submit" page={SubmitSongPage} name="submitSong" />
        <Route path="/leagues/{id}/rounds/{roundId}/vote" page={VotePage} name="vote" />
        <Route path="/leagues/{id}/rounds/{roundId}/results" page={ResultsPage} name="results" />
      </PrivateSet>

      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
