const AUTO_MS = 2600

function initStack(stackEl) {
  const section = stackEl.closest('.section')
  let autoId = null
  let userHoldUntil = 0
  let isAnimating = false
  const cards = Array.from(stackEl.querySelectorAll('.card'))
  const dots = document.createElement('div')
  dots.className = 'dots'
  for (let i = 0; i < cards.length; i++) {
    const d = document.createElement('span')
    d.className = 'dot'
    dots.appendChild(d)
  }
  stackEl.parentElement.appendChild(dots)

  function updateDots() {
    const items = Array.from(dots.children)
    const topIndex = cards.indexOf(stackEl.lastElementChild)
    items.forEach((el, i) => el.classList.toggle('is-active', i === topIndex))
  }
  updateDots()

  function popAndReorder(target) {
    if (!stackEl || !target || isAnimating) return
    isAnimating = true
    target.classList.add('pop')
    setTimeout(() => {
      stackEl.appendChild(target)
      target.classList.remove('pop')
      isAnimating = false
      updateDots()
    }, 620)
  }

  function prevAndReorder() {
    if (isAnimating) return
    isAnimating = true
    const last = stackEl.lastElementChild
    if (!last) { isAnimating = false; return }
    last.classList.add('swipe-right')
    setTimeout(() => {
      stackEl.insertBefore(last, stackEl.firstElementChild)
      last.classList.remove('swipe-right')
      isAnimating = false
      updateDots()
    }, 500)
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      userHoldUntil = Date.now() + 5000
      popAndReorder(card)
    }, { passive: true })
    card.addEventListener('touchend', () => {
      userHoldUntil = Date.now() + 5000
      popAndReorder(card)
    }, { passive: true })
  })

  let startX = 0
  let startY = 0
  let moved = false
  const TH = 18
  function onStart(e) {
    moved = false
    startX = (e.touches ? e.touches[0].clientX : e.clientX)
    startY = (e.touches ? e.touches[0].clientY : e.clientY)
  }
  function onMove(e) {
    if (isAnimating) return
    const x = (e.touches ? e.touches[0].clientX : e.clientX)
    const y = (e.touches ? e.touches[0].clientY : e.clientY)
    if (Math.abs(x - startX) > TH && Math.abs(x - startX) > Math.abs(y - startY)) {
      moved = true
      e.preventDefault && e.preventDefault()
    }
  }
  function onEnd(e) {
    const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX)
    const dx = x - startX
    if (!moved || Math.abs(dx) < TH) return
    if (dx < 0) {
      const next = stackEl.firstElementChild
      if (next) {
        next.classList.add('swipe-left')
        setTimeout(() => next.classList.remove('swipe-left'), 500)
        popAndReorder(next)
      }
    } else {
      prevAndReorder()
    }
  }
  stackEl.addEventListener('touchstart', onStart, { passive: true })
  stackEl.addEventListener('touchmove', onMove, { passive: false })
  stackEl.addEventListener('touchend', onEnd, { passive: true })
  stackEl.addEventListener('mousedown', onStart)
  stackEl.addEventListener('mousemove', onMove)
  stackEl.addEventListener('mouseup', onEnd)

  function startAuto() {
    if (autoId || !stackEl) return
    autoId = setInterval(() => {
      if (Date.now() < userHoldUntil) return
      if (document.hidden) return
      const next = stackEl.firstElementChild
      if (next) popAndReorder(next)
    }, AUTO_MS)
  }

  function stopAuto() {
    if (autoId) {
      clearInterval(autoId)
      autoId = null
    }
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) startAuto()
      else stopAuto()
    })
  }, { threshold: 0.1 })
  if (section) io.observe(section)

  function inView(el) {
    if (!el) return false
    const r = el.getBoundingClientRect()
    const h = window.innerHeight || document.documentElement.clientHeight
    return r.top < h * 0.9 && r.bottom > h * 0.1
  }
  if (inView(section)) startAuto()

  return { startAuto, stopAuto, section }
}

const controllers = []
document.querySelectorAll('.card-stack').forEach(stackEl => {
  controllers.push(initStack(stackEl))
})

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible')
        observer.unobserve(e.target)
      }
    })
  },
  { threshold: 0.15 }
)

document.querySelectorAll('.section__text, .section__media').forEach(el => {
  el.classList.add('reveal')
  observer.observe(el)
})

function setupFlowers() {
  if (!flowers.length) return
  function distToCorner(x, y, corner) {
    if (corner.classList.contains('flower--tl')) return Math.hypot(x - 0, y - 0)
    if (corner.classList.contains('flower--tr')) return Math.hypot(x - window.innerWidth, y - 0)
    if (corner.classList.contains('flower--bl')) return Math.hypot(x - 0, y - window.innerHeight)
    return Math.hypot(x - window.innerWidth, y - window.innerHeight)
  }
  let lastX = 0, lastY = 0, raf = 0
  function onMove(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX
    const y = e.touches ? e.touches[0].clientY : e.clientY
    lastX = x; lastY = y
    if (!raf) raf = requestAnimationFrame(tick)
  }
  function tick() {
    raf = 0
    flowers.forEach(f => {
      const d = distToCorner(lastX, lastY, f)
      const near = d < Math.min(window.innerWidth, window.innerHeight) * 0.5
      f.classList.toggle('bloom', near)
    })
  }
  window.addEventListener('mousemove', onMove, { passive: true })
  window.addEventListener('touchmove', onMove, { passive: true })
  flowers.forEach(f => f.classList.add('bloom'))
  setTimeout(() => flowers.forEach(f => f.classList.remove('bloom')), 1200)
}
setupFlowers()

function typer(elements, opts = { speed: 18, lineDelay: 180 }) {
  const items = Array.from(elements)
  const run = async () => {
    for (const el of items) {
      const full = el.textContent
      el.textContent = ''
      el.style.visibility = 'visible'
      await new Promise(res => {
        let i = 0
        function tick() {
          el.textContent = full.slice(0, i++)
          if (i <= full.length) setTimeout(tick, opts.speed)
          else res()
        }
        tick()
      })
      await new Promise(r => setTimeout(r, opts.lineDelay))
    }
  }
  return { run }
}

function setupTyping() {
  const heroTitle = document.querySelector('.hero__title')
  const momText = document.querySelectorAll('#mom .section__text p')
  const sisText = document.querySelectorAll('#sister .section__text p')
  if (heroTitle) {
    const t = typer([heroTitle], { speed: 12, lineDelay: 0 })
    heroTitle.style.visibility = 'hidden'
    const o = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          t.run()
          o.disconnect()
        }
      })
    }, { threshold: 0.4 })
    o.observe(heroTitle)
  }
  const makeObserver = (nodeList) => {
    const els = Array.from(nodeList)
    if (!els.length) return
    els.forEach(el => el.style.visibility = 'hidden')
    const t = typer(els, { speed: 14, lineDelay: 120 })
    const o = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          t.run()
          o.disconnect()
        }
      })
    }, { threshold: 0.3 })
    o.observe(els[0].closest('.section__text'))
  }
  makeObserver(momText)
  makeObserver(sisText)
}
setupTyping()

function setupTilt() {
  const containers = document.querySelectorAll('.card-stack')
  function applyTilt(x, y) {
    containers.forEach(c => {
      c.style.setProperty('--tiltY', (x * 4).toFixed(2) + 'deg')
      c.style.setProperty('--tiltX', (y * -4).toFixed(2) + 'deg')
    })
  }
  window.addEventListener('mousemove', e => {
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const dx = (e.clientX - cx) / cx
    const dy = (e.clientY - cy) / cy
    applyTilt(dx * 0.2, dy * 0.2)
  })
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
    const btn = document.createElement('button')
    btn.textContent = 'Tilt on'
    btn.style.cssText = 'position:fixed;bottom:10px;left:10px;z-index:9999;padding:8px 12px;border-radius:10px;border:none;background:#ffffff22;color:#fff;backdrop-filter:blur(8px)'
    btn.addEventListener('click', async () => {
      try {
        const r = await DeviceOrientationEvent.requestPermission()
        if (r === 'granted') {
          window.addEventListener('deviceorientation', e => {
            const g = (e.gamma || 0) / 45
            const b = (e.beta || 0) / 45
            applyTilt(g * 0.4, b * 0.2)
          })
          btn.remove()
        }
      } catch (_) { btn.remove() }
    })
    document.body.appendChild(btn)
  } else {
    window.addEventListener('deviceorientation', e => {
      const g = (e.gamma || 0) / 45
      const b = (e.beta || 0) / 45
      applyTilt(g * 0.4, b * 0.2)
    })
  }
}
setupTilt()

document.addEventListener('visibilitychange', () => {
  if (document.hidden) controllers.forEach(c => c.stopAuto())
  else controllers.forEach(c => {
    const r = c.section && c.section.getBoundingClientRect()
    const h = window.innerHeight || document.documentElement.clientHeight
    if (r && r.top < h * 0.9 && r.bottom > h * 0.1) c.startAuto()
  })
})

const heroCanvas = document.querySelector('.particles--hero')
const momCanvas = document.querySelector('.particles--mom')
const sisterCanvas = document.querySelector('.particles--sister')
const confettiCanvas = document.querySelector('.confetti')
const flowers = Array.from(document.querySelectorAll('.flower'))

const audioButtons = Array.from(document.querySelectorAll('.audio-ctrl'))
const audios = Array.from(document.querySelectorAll('audio[id^="audio-"]'))

audios.forEach(a => {
  a.volume = 0.65
  a.setAttribute('playsinline', '')
})

function updateButtonState(btn, playing) {
  btn.classList.toggle('is-playing', playing)
  btn.setAttribute('aria-pressed', playing ? 'true' : 'false')
}

audioButtons.forEach(btn => {
  const id = btn.getAttribute('data-audio')
  const audio = document.getElementById(id)
  if (!audio) return
  audio.addEventListener('play', () => updateButtonState(btn, true))
  audio.addEventListener('pause', () => updateButtonState(btn, false))
  btn.addEventListener('click', () => {
    if (audio.paused) {
      audios.forEach(a => { if (a !== audio) { a.pause(); a.volume = 0 } })
      audio.volume = 0
      const p = audio.play()
      if (p && typeof p.then === 'function') {
        p.then(() => fadeIn(audio, 450, 0.65))
         .catch(() => showToast('Музыка не запустилась. Включи звук/громкость и попробуй ещё раз.'))
      }
    } else {
      fadeOut(audio, 350).then(() => audio.pause())
    }
  }, { passive: false })
})

const audioObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const section = e.target
    const btn = section.querySelector('.audio-ctrl')
    const id = btn && btn.getAttribute('data-audio')
    const audio = id && document.getElementById(id)
    if (!audio) return
    if (!e.isIntersecting) audio.pause()
  })
}, { threshold: 0.1 })

document.querySelectorAll('.section').forEach(sec => audioObs.observe(sec))

function fadeIn(a, ms, target = 0.65) {
  return new Promise(resolve => {
    const start = performance.now()
    function step(t) {
      const k = Math.min(1, (t - start) / ms)
      a.volume = k * target
      if (k < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}
function fadeOut(a, ms) {
  return new Promise(resolve => {
    const start = performance.now()
    const from = a.volume
    function step(t) {
      const k = Math.min(1, (t - start) / ms)
      a.volume = from * (1 - k)
      if (k < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

let toastEl = null
function showToast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.className = 'toast'
    document.body.appendChild(toastEl)
  }
  toastEl.textContent = msg
  toastEl.classList.add('show')
  clearTimeout(showToast._to)
  showToast._to = setTimeout(() => toastEl.classList.remove('show'), 2600)
}

function Particles(canvas, opts = {}) {
  this.c = canvas
  this.ctx = canvas.getContext('2d')
  this.count = opts.count || 36
  this.colors = opts.colors || ['#ff4d6d88', '#7c4dff66', '#ffffff44']
  this.speed = opts.speed || 0.35
  this.running = false
  this.pxRatio = Math.min(window.devicePixelRatio || 1, 2)
  this.ps = []
  this.resize = () => {
    const rect = this.c.getBoundingClientRect()
    this.c.width = Math.floor(rect.width * this.pxRatio)
    this.c.height = Math.floor(rect.height * this.pxRatio)
    this.ps = Array.from({ length: this.count }).map(() => {
      const s = Math.random() * 1.8 + 0.7
      return {
        x: Math.random() * this.c.width,
        y: Math.random() * this.c.height,
        r: s * this.pxRatio,
        vx: (Math.random() - 0.5) * this.speed * this.pxRatio,
        vy: (-Math.random() * this.speed - 0.05) * this.pxRatio,
        a: Math.random() * 0.5 + 0.25,
        ca: (Math.random() * 0.5 + 0.2) * 0.002,
        color: this.colors[Math.floor(Math.random() * this.colors.length)]
      }
    })
  }
  this.step = (dt) => {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.c.width, this.c.height)
    for (const p of this.ps) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.a += p.ca * dt
      if (p.a > 1 || p.a < 0.15) p.ca *= -1
      if (p.y < -10) p.y = this.c.height + 10
      if (p.x < -10) p.x = this.c.width + 10
      if (p.x > this.c.width + 10) p.x = -10
      ctx.beginPath()
      ctx.fillStyle = p.color
      ctx.globalAlpha = p.a
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }
  this.loop = (t) => {
    if (!this.running) return
    if (!this.lt) this.lt = t
    const dt = Math.min(60, t - this.lt)
    this.lt = t
    this.step(dt)
    this.raf = requestAnimationFrame(this.loop)
  }
  this.start = () => {
    if (this.running) return
    this.running = true
    this.lt = 0
    this.raf = requestAnimationFrame(this.loop)
  }
  this.stop = () => {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
  }
}

let heroP = null
let momP = null
let sisterP = null
let confettiP = null

function setupParticles() {
  if (heroCanvas && !heroP) {
    heroP = new Particles(heroCanvas, { count: 42, speed: 0.3 })
    heroP.resize()
    heroP.start()
  }
  if (momCanvas && !momP) {
    momP = new Particles(momCanvas, { count: 28, speed: 0.32 })
    momP.resize()
  }
  if (sisterCanvas && !sisterP) {
    sisterP = new Particles(sisterCanvas, { count: 28, speed: 0.32 })
    sisterP.resize()
  }
  if (confettiCanvas && !confettiP) {
    const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#B980F0'].map(c => c + 'cc')
    confettiP = new Particles(confettiCanvas, { count: 60, speed: 0.45, colors })
    confettiP.resize()
  }
}

setupParticles()
window.addEventListener('resize', () => {
  if (heroP) heroP.resize()
  if (momP) momP.resize()
  if (sisterP) sisterP.resize()
  if (confettiP) confettiP.resize()
})

const pObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const c = e.target
    if (c === heroCanvas && heroP) {
      if (e.isIntersecting) heroP.start()
      else heroP.stop()
    }
    if (c === momCanvas && momP) {
      if (e.isIntersecting) momP.start()
      else momP.stop()
    }
    if (c === sisterCanvas && sisterP) {
      if (e.isIntersecting) sisterP.start()
      else sisterP.stop()
    }
    if (c === confettiCanvas && confettiP) {
      if (e.isIntersecting) confettiP.start()
      else confettiP.stop()
    }
  })
}, { threshold: 0.05 })

if (heroCanvas) pObs.observe(heroCanvas)
if (momCanvas) pObs.observe(momCanvas)
if (sisterCanvas) pObs.observe(sisterCanvas)
if (confettiCanvas) pObs.observe(confettiCanvas)

const replay = document.getElementById('replayBtn')
if (replay) {
  replay.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    controllers.forEach(c => c.startAuto())
  })
}
