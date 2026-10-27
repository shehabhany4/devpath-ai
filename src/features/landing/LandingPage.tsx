import { Navbar } from '@/components/layout/Navbar'
import { Hero } from './components/Hero'
import { Features } from './components/Features'

export function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Hero />
        <Features />
      </main>
    </>
  )
}