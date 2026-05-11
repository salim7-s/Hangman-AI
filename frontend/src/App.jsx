import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home             from './pages/Home'
import Game             from './pages/Game'
import MultiplayerLobby from './pages/MultiplayerLobby'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/game"        element={<Game />} />
        <Route path="/multiplayer" element={<MultiplayerLobby />} />
      </Routes>
    </BrowserRouter>
  )
}
