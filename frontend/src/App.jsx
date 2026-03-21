import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import "./App.css"

const Navbar = () => {
  return (
    <nav className='navbar'>
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className='logo'>
          <span className='icon'>📅</span>
            <h1>Registro orario</h1>       
        </div>
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-item">Calendario</Link>
        <Link to="/login" className="login-btn">Area Riservata</Link>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className='wrapper'>
        <Navbar/>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<div>Login</div>} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
      </div>
      
    </Router>
  );
}

export default App;