import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { FlowProvider } from "@/lib/flowContext";
import Boot from "./pages/Boot";
import MainMenu from "./pages/MainMenu";
import Scan from "./pages/Scan";
import Scenarios from "./pages/Scenarios";
import MissionBriefing from "./pages/MissionBriefing";
import SectorMap from "./pages/SectorMap";
import SectorDetail from "./pages/SectorDetail";
import SectorTargets from "./pages/SectorTargets";
import OperationReview from "./pages/OperationReview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FlowProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Boot />} />
          <Route path="/new-user" element={<Boot />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/briefing" element={<MissionBriefing />} />
          <Route path="/sectors" element={<SectorMap />} />
          <Route path="/sector/:key" element={<SectorDetail />} />
          <Route path="/sector/:key/targets" element={<SectorTargets />} />
          <Route path="/review" element={<OperationReview />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </FlowProvider>
  </QueryClientProvider>
);

export default App;
