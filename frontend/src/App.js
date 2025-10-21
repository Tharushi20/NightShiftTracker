
import './App.css';
import { BrowserRouter as Router , Route , Routes} from 'react-router-dom';
import Header from './components/Header';
import Home from "./components/Home";
import ShiftForm from './components/ShiftForm';
import ShiftMonitor from './components/ShiftMonitor';


function App() {
  return (
    <Router>
      <div className='App'>
        <Header/>
        <Routes>
          <Route path='/' exact Component={Home}/>
          <Route path='/shifts' Component={ShiftForm}/>
          <Route path='/monitor' Component={ShiftMonitor}/>
        </Routes>

      </div>
    </Router>
  );
}

export default App;
