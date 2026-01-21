import { useEffect } from 'react'
import Index from './routes/Index'
import { useTheme } from './store/Themestore'
import { AppSplash } from './components/auth/AppSplash'
import BackgroundJobModal from './components/explorer/BackgroundJobModal'
import UploadModal from './components/explorer/UploadModal'

const App = () => {
  const { current, name } = useTheme()

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
      </div>
    </AppSplash>
  )
}

export default App