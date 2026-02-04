import { useEffect } from 'react'
import Index from './routes/Index'
import { useTheme, applyAppearanceSettings } from './store/Themestore'
import { useUser } from './store/Userstore'
import { AppSplash } from './components/auth/AppSplash'
import BackgroundJobModal from './components/explorer/BackgroundJobModal'
import BackgroundPlayer from './components/explorer/BackgroundPlayer'
import UploadModal from './components/explorer/UploadModal'
import StorageReductionWorkflow from './components/explorer/StorageReductionWorkflow'
import GlobalAlert from './components/base/GlobalAlert'

const App = () => {
  const { current, name } = useTheme()
  const { isAuthenticated } = useUser()

  useEffect(() => {
    // Apply appearance settings (font size, font family, reduced motion) globally on mount
    applyAppearanceSettings()
  }, [])

  useEffect(() => {
    // Initialize theme on app load
    if (name === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    document.body.style.backgroundColor = current.background
  }, [current, name])

  return (
    <AppSplash>
      <div style={{ backgroundColor: current.background, minHeight: "100vh" }}>
        {/* router entry  */}
        <Index />
        <BackgroundJobModal />
        <UploadModal />
        <StorageReductionWorkflow />
        <GlobalAlert />
        {/* Background player persists across all routes when authenticated */}
        {isAuthenticated && <BackgroundPlayer />}
      </div>
    </AppSplash>
  )
}

export default App