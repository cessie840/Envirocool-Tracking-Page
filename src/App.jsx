import { HashRouter as Router, Routes, Route } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import Customer from "./Customer";
import CustomerTrackingPage from "./CustomerTrackingPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerTrackingPage />} />
        <Route path="/customer/:trackingNumber" element={<Customer />} />
      </Routes>
    </Router>
  );
}

export default App;
