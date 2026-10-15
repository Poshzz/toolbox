import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Fixed animated art layer behind the whole app:
 * - soft gradient wash + drifting color blobs (coffee palette)
 * - hand-drawn SVG art (coffee ring stain, beans, steam waves)
 * - fine grain noise
 * Parallax: any element on the page with a `data-speed` attribute is
 * translated on scroll with a lerp for a smooth, weighted feel.
 */
export default function Background() {
  const { pathname } = useLocation()
  const itemsRef = useRef<HTMLElement[]>([])

  // collect parallax targets (Background art + anything a page adds)
  useEffect(() => {
    itemsRef.current = Array.from(document.querySelectorAll<HTMLElement>('[data-speed]'))
  }, [pathname])

  // smooth scroll parallax loop (transform-only, runs on the GPU)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let target = window.scrollY
    let current = target
    let raf = 0
    const onScroll = () => {
      target = window.scrollY
    }
    const tick = () => {
      current += (target - current) * 0.08
      for (const el of itemsRef.current) {
        el.style.transform = `translate3d(0, ${(current * Number(el.dataset.speed ?? 0)).toFixed(2)}px, 0)`
      }
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-base absolute inset-0" />

      {/* drifting color blobs (each sits in a parallax wrapper) */}
      <div data-speed="-0.04" className="absolute -top-[20vh] -left-[14vw] h-[72vh] w-[72vh]">
        <div className="bg-blob blob-rust" />
      </div>
      <div data-speed="-0.07" className="absolute top-[16vh] -right-[18vw] h-[82vh] w-[82vh]">
        <div className="bg-blob blob-gold" />
      </div>
      <div data-speed="-0.05" className="absolute -bottom-[22vh] left-[12vw] h-[70vh] w-[70vh]">
        <div className="bg-blob blob-olive" />
      </div>
      <div data-speed="-0.03" className="absolute -top-[12vh] left-[26vw] h-[64vh] w-[64vh]">
        <div className="bg-blob blob-cream" />
      </div>

      {/* coffee ring stain */}
      <svg
        data-speed="-0.12"
        viewBox="0 0 600 600"
        fill="none"
        className="absolute -top-[6vh] -right-[16vw] h-[76vh] w-[76vh]"
      >
        <circle
          cx="300"
          cy="300"
          r="238"
          stroke="#c89b54"
          strokeOpacity="0.30"
          strokeWidth="14"
          strokeDasharray="1 30"
          strokeLinecap="round"
        />
        <circle cx="300" cy="300" r="196" stroke="#c24e2a" strokeOpacity="0.20" strokeWidth="1.5" />
        <circle
          cx="300"
          cy="300"
          r="150"
          stroke="#8f3719"
          strokeOpacity="0.16"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <circle cx="300" cy="300" r="255" stroke="#221b12" strokeOpacity="0.08" strokeWidth="1" />
      </svg>

      {/* steam waves */}
      <svg
        data-speed="-0.045"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        fill="none"
        className="absolute top-[34vh] left-0 h-[22vh] w-full"
      >
        <path
          d="M0 100 C 120 40 240 160 360 100 S 600 40 720 100 S 960 160 1080 100 S 1320 40 1440 100"
          stroke="#c89b54"
          strokeOpacity="0.30"
          strokeWidth="1.5"
        />
        <path
          d="M0 128 C 140 78 260 178 400 128 S 640 78 780 128 S 1020 178 1160 128 S 1360 88 1440 118"
          stroke="#c24e2a"
          strokeOpacity="0.14"
          strokeWidth="1.5"
        />
      </svg>

      {/* scattered beans + dots */}
      <svg
        data-speed="-0.08"
        viewBox="0 0 420 420"
        fill="none"
        className="absolute bottom-[4vh] -left-[9vw] h-[46vh] w-[46vh]"
      >
        <g stroke="#221b12" strokeOpacity="0.10" strokeWidth="1.5">
          <g transform="translate(96 102) rotate(-26)">
            <ellipse rx="24" ry="36" />
            <path d="M0 -27 Q 9 0 0 27" />
          </g>
          <g transform="translate(300 150) rotate(38)">
            <ellipse rx="19" ry="29" />
            <path d="M0 -21 Q 8 0 0 21" />
          </g>
          <g transform="translate(150 320) rotate(-12)">
            <ellipse rx="21" ry="32" />
            <path d="M0 -24 Q 8 0 0 24" />
          </g>
        </g>
        <g transform="translate(332 330) rotate(55)" stroke="#c24e2a" strokeOpacity="0.25" strokeWidth="1.5">
          <ellipse rx="15" ry="23" />
          <path d="M0 -17 Q 6 0 0 17" />
        </g>
        <circle cx="238" cy="72" r="4" fill="#221b12" fillOpacity="0.10" />
        <circle cx="70" cy="228" r="3" fill="#c89b54" fillOpacity="0.50" />
        <circle cx="250" cy="256" r="3" fill="#65724b" fillOpacity="0.40" />
        <circle cx="380" cy="60" r="2.5" fill="#c24e2a" fillOpacity="0.35" />
      </svg>

      <div className="bg-noise absolute inset-0" />
    </div>
  )
}
