import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import './App.css';
import PathSetter from "./components/PathSetter";
import "./config/firebaseConfig";
import Store from "./context/Store";
import Landing from './pages/app/Landing';
import Logon from './pages/authentication/Logon';
import LogonRoute from './routes/LogonRoute';

function App() {
  return (
    <BrowserRouter>
      <Store>
        <PathSetter />
        <div className="App">
          <Switch>
            <LogonRoute path={"/app"} component={Landing} />
            <Route component={Logon} />
          </Switch>
        </div>
      </Store>
    </BrowserRouter>
  );
}

export default App;
