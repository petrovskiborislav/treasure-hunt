import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import PuzzlePage from "./pages/PuzzlePage";

function App (){
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/puzzle" element={<PuzzlePage />} />
        </Routes>
      </Router>
  );
}

export default App;