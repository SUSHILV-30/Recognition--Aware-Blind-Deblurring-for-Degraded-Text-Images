import { useEffect, useState } from 'react'

// Hash routes keep the site a single static page that works on GitHub Pages:
// "#/models/<id>" opens a model page, any other hash is a section on the home page.
function parse() {
  const hash = window.location.hash
  const m = hash.match(/^#\/models\/([\w-]+)/)
  if (m) return { page: 'model', id: m[1] }
  return { page: 'home', anchor: hash.length > 1 ? decodeURIComponent(hash.slice(1)) : null }
}

export function useRoute() {
  const [route, setRoute] = useState(parse)
  useEffect(() => {
    const onChange = () => setRoute(parse())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
