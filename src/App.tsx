import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Mint from "./components/Mint";
import Admin from './pages/Admin';
import Proof from './pages/proof/[tokenId]';
import Upgrade from './pages/upgrade/[tokenId]';
import Wl from "./pages/Wl";

export default function Home() {
  return (
      <Router>
      <Routes>
        <Route path="/" element={<Mint />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/wl" element={<Wl />} />
        <Route path="/proof/:tokenId" element={<Proof />} />
        <Route path="/upgrade/:tokenId" element={<Upgrade />} />
      </Routes>
    </Router>
  );
}
