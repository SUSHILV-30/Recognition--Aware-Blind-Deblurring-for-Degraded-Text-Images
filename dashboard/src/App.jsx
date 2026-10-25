import { useEffect } from 'react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Problem from './components/Problem.jsx'
import Pipeline from './components/Pipeline.jsx'
import Architecture from './components/Architecture.jsx'
import Models from './components/Models.jsx'
import Compare from './components/Compare.jsx'
import Ocr from './components/Ocr.jsx'
import Findings from './components/Findings.jsx'
import Team, { Footer } from './components/Team.jsx'
import ModelPage from './components/ModelPage.jsx'
import { LightboxProvider } from './components/ui.jsx'
import { modelById } from './data/models.js'
import { useRoute } from './route.js'

const TITLE = 'Recognition-Aware Blind Deblurring'

function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Architecture />
      <Pipeline />
      <Models />
      <Compare />
      <Ocr />
      <Findings />
      <Team />
    </>
  )
}

export default function App() {
  const route = useRoute()
  const model = route.page === 'model' ? modelById(route.id) : null

  // Moving between pages: model pages open at the top, home links land on their section.
  useEffect(() => {
    if (model) {
      document.title = `${model.full} · ${TITLE}`
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    document.title = TITLE
    if (route.anchor) document.getElementById(route.anchor)?.scrollIntoView({ behavior: 'instant' })
  }, [model, route.page])

  return (
    <LightboxProvider>
      {!model && <a className="skip" href="#problem">Skip to content</a>}
      <Nav page={model ? 'model' : 'home'} />
      <main key={model ? model.id : 'home'} className="page-enter">
        {model ? <ModelPage model={model} /> : <Home />}
      </main>
      <Footer />
    </LightboxProvider>
  )
}
