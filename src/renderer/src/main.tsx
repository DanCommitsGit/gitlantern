import '@fontsource-variable/ibm-plex-sans'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { reportErrors } from './report-errors'
import { SettingsProvider } from './settings/SettingsProvider'

reportErrors()
document.documentElement.dataset['platform'] = window.api.platform

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <SettingsProvider>
                <App />
            </SettingsProvider>
        </ErrorBoundary>
    </StrictMode>
)
