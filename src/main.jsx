import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DiscoveryChat from './pages/DiscoveryChat'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DiscoveryChat />
  </StrictMode>
)
