import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { OutagePlan } from "@/pages/OutagePlan";
import { Schedule } from "@/pages/Schedule";
import { AccessControl } from "@/pages/AccessControl";
import { Dosimetry } from "@/pages/Dosimetry";
import { Maintenance } from "@/pages/Maintenance";
import { Quality } from "@/pages/Quality";
import { Experience } from "@/pages/Experience";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<OutagePlan />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/access" element={<AccessControl />} />
          <Route path="/dosimetry" element={<Dosimetry />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/quality" element={<Quality />} />
          <Route path="/experience" element={<Experience />} />
        </Routes>
      </Layout>
    </Router>
  );
}
