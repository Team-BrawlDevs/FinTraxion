import { motion } from 'framer-motion'
import { pageTransition } from '../utils/animations'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import Hero from '../components/sections/Hero'
import FeaturesSection from '../components/sections/FeaturesSection'
import CFOCopilotSection from '../components/sections/CFOCopilot'
import SimulationSection from '../components/sections/SimulationSection'
import ImpactSection from '../components/sections/ImpactSection'
import BackgroundDecor from '../components/ui/BackgroundDecor'

export default function Home() {
  return (
    <motion.div {...pageTransition} className="relative">
      <BackgroundDecor />
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <FeaturesSection />
          <CFOCopilotSection />
          <SimulationSection />
          <ImpactSection />
        </main>
        <Footer />
      </div>
    </motion.div>
  )
}
