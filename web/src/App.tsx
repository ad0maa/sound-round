import type { ReactNode } from 'react'

import { FatalErrorBoundary, RedwoodProvider } from '@cedarjs/web'
import { RedwoodApolloProvider } from '@cedarjs/web/apollo'

import { ThemeProvider } from 'src/lib/theme'
import FatalErrorPage from 'src/pages/FatalErrorPage'

import { AuthProvider, useAuth } from './auth.js'

import './index.css'
import './scaffold.css'

interface AppProps {
  children?: ReactNode
}

const App = ({ children }: AppProps) => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <ThemeProvider>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <AuthProvider>
          <RedwoodApolloProvider useAuth={useAuth}>
            {children}
          </RedwoodApolloProvider>
        </AuthProvider>
      </RedwoodProvider>
    </ThemeProvider>
  </FatalErrorBoundary>
)

export default App
