import React from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Provider } from "./context/Context";
import CookieConsent from "react-cookie-consent";
import Header from "./components/Header/index";
import Sidebar from "./components/Sidebar/Sidebar";
import Staking from "./components/Staking/";
import Governance from "./components/Governance/";
import Tokenomics from "./components/Tokenomics/";
import Treasury from "./components/Treasury/";
import Nav from "./components/NavBar";
import "./App.css";

import SelectWalletModal from "./components/Modals/SelectWalletModal";

const App = () => {
  return (
    <div className="app-container">
      <Provider>
        <BrowserRouter>
          <Header />
          <div className="body-main">
            <Nav />
            <main className="body">
              <Switch>
                <Route exact path="/">
                  <Staking />
                </Route>
                <Route path="/treasury">
                  <Treasury />
                </Route>
                <Route path="/governance">
                  <Governance />
                </Route>
                <Route path="/tokenomics">
                  <Tokenomics />
                </Route>
              </Switch>
              <div className="body-sidebar">
                <Sidebar />
              </div>
              <CookieConsent>
                This website uses cookies to enhance the user experience.
              </CookieConsent>
            </main>
          </div>
        </BrowserRouter>
        <SelectWalletModal />
      </Provider>
    </div>
  );
};

export default App;
