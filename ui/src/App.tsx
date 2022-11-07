import React from "react";
import Home from "./Pages/Home/Home";
import "./assets/css/App.css";

function App() {
  const hasData: boolean = true;
  return (
    <div className="App">
      <Home hasData={hasData} />
    </div>
  );
}

export default App;
