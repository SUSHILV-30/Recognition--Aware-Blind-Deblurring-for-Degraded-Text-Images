import { SectionHead } from './ui.jsx'
import { papers, team } from '../data/project.js'

const REPO = 'https://github.com/SUSHILV-30/Recognition-Aware-Blind-Deblurring-for-Degraded-Text-Images'

const initials = (name) => name.split(' ').filter((p) => p.length > 1).slice(0, 2).map((p) => p[0]).join('')

export default function Team() {
  return (
    <>
      <section className="block" id="team">
        <div className="wrap">
          <SectionHead title="Team 48">
            Department of Computer Science and Engineering, Amrita School of Computing, Amrita Vishwa
            Vidyapeetham, Coimbatore. Guided by Dr. Padmavathi S., Associate Professor.
          </SectionHead>
          <div className="team">
            {team.map((p) => (
              <div className="person" key={p.name}>
                <div className="avatar" style={{ background: p.color }} aria-hidden="true">{initials(p.name)}</div>
                <b>{p.name}</b>
                <span>{p.study}</span>
              </div>
            ))}
          </div>

          <h3 style={{ margin: '48px 0 8px' }}>Papers</h3>
          <ul className="papers">
            {papers.map((p) => (
              <li key={p.title}>{p.title}<span>{p.where}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span>Dataset: <a href="https://www.fips.fi/HDC2021.php">Helsinki Deblur Challenge 2021</a>, Finnish Inverse Problems Society.</span>
          <a href={REPO}>Source code on GitHub</a>
        </div>
      </footer>
    </>
  )
}
