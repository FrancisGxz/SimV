import './style.css'

import { SimulationApp } from './SimulationApp'

console.info('[App] Starting')

const app = new SimulationApp(document.body)

try {
    app.start()
    console.info('[App] Started')
} catch (error) {
    console.error('[App] Failed to start', error)
    throw error
}

function shutdown(): void {
    console.info('[App] Shutting down')

    app.stop()

    console.info('[App] Shutdown complete')
}

window.addEventListener('beforeunload', shutdown)

window.addEventListener('error', event => {
    console.error('[App] Unhandled error', event.error)
})

window.addEventListener('unhandledrejection', event => {
    console.error('[App] Unhandled promise rejection', event.reason)
})
