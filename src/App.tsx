import { Routes, Route } from "react-router-dom"
import Slicing from "./apps/slicing/slicing"
import SlicingHard from "./apps/slicing/slicing-hard"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Slicing />} />
      <Route path="/hard" element={<SlicingHard />} />
    </Routes>
  )
}

export default App
