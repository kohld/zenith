import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
