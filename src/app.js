// MONSTER MERGE — application bootstrap.
import { init } from './ui.js'

function boot() {
  try {
    init()
  } catch (error) {
    console.error('MONSTER MERGE failed to start', error)
    const root = document.getElementById('view-root')
    if (root) {
      root.innerHTML = `<div class="view-inner"><div class="empty-state" style="margin-top:12vh">
        <div class="empty-icon">!</div>
        <h3>The grove could not open</h3>
        <p>Something went wrong while starting the game. Please refresh the page.</p>
        <button class="btn btn-primary" onclick="location.reload()">Try again</button>
      </div></div>`
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true })
} else {
  boot()
}
