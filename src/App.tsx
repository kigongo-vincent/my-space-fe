import { useEffect } from 'react'
import Index from './routes/Index'
import { useTheme } from './store/Themestore'

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
    <div style={{ backgroundColor: current.background, minHeight: "100vh" }}>

      {/* router entry  */}
      <Index />
    </div>
  )
}

export default App