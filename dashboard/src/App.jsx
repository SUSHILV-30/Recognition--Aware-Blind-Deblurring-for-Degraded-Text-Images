import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Problem from './components/Problem.jsx'
import Pipeline from './components/Pipeline.jsx'
import Studies from './components/Studies.jsx'
import Phase2 from './components/Phase2.jsx'
import Compare from './components/Compare.jsx'
import Ocr from './components/Ocr.jsx'
import Findings from './components/Findings.jsx'
import Team from './components/Team.jsx'
import { LightboxProvider } from './components/ui.jsx'

export default function App() {
  return (
    <LightboxProvider>
      <a className="skip" href="#problem">Skip to content</a>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Pipeline />
        <Studies />
        <Phase2 />
        <Compare />
        <Ocr />
        <Findings />
        <Team />
      </main>
    </LightboxProvider>
  )
}
