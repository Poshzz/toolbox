import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Background from './components/Background'
import Header from './components/Header'
import Footer from './components/Footer'
import SearchDialog from './components/SearchDialog'
import Home from './pages/Home'
import ToolHost from './pages/ToolHost'
import NotFound from './pages/NotFound'

function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current
      if (!el) return
      const h = document.documentElement.scrollHeight - window.innerHeight
      el.style.transform = `scaleX(${h > 0 ? Math.min(window.scrollY / h, 1) : 0})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 z-50 h-[3px] w-full origin-left scale-x-0 bg-rust"
    />
  )
}

export default function App() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Background />
      <ScrollProgress />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tool/:id" element={<ToolHost />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <SearchDialog />
    </div>
  )
}
