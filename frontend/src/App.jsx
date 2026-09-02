import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home             from './pages/Home'
import Game             from './pages/Game'
import MultiplayerLobby from './pages/MultiplayerLobby'
import InspectorModels  from './pages/InspectorModels'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/game"        element={<Game />} />
        <Route path="/multiplayer" element={<MultiplayerLobby />} />
        <Route path="/inspectors"  element={<InspectorModels />} />
      </Routes>
    </BrowserRouter>
  )
}
