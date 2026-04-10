import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { FlowProvider } from "@/lib/flowContext";
import RouteGuard from "@/components/RouteGuard";
import PageTransition from "@/components/PageTransition";
import { useIdleNotification } from "@/hooks/useIdleNotification";
import Boot from "./pages/Boot";
import MainMenu from "./pages/MainMenu";
import Scan from "./pages/Scan";
import Scenarios from "./pages/Scenarios";
import ScenarioDetail from "./pages/ScenarioDetail";
import Options from "./pages/Options";
import MissionBriefing from "./pages/MissionBriefing";
import SectorMap from "./pages/SectorMap";
import SectorDetail from "./pages/SectorDetail";
import SectorTargets from "./pages/SectorTargets";
import OperationReview from "./pages/OperationReview";
import SystemExplainer from "./pages/SystemExplainer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppInner() {
  useIdleNotification();
  return (
    <BrowserRouter>
      <PageTransition>
        <Routes>
          <Route path="/" element={<Boot />} />
          <Route path="/new-user" element={<Boot />} />
          <Route path="/menu" element={
            <RouteGuard requireUsername>
              <MainMenu />
            </RouteGuard>
          } />
          <Route path="/scan" element={
            <RouteGuard requireUsername>
              <Scan />
            </RouteGuard>
          } />
          <Route path="/explainer" element={
            <RouteGuard requireUsername>
              <SystemExplainer />
            </RouteGuard>
          } />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/scenario/:id" element={<ScenarioDetail />} />
          <Route path="/options" element={<Options />} />
          <Route path="/briefing" element={
            <RouteGuard requireUsername requireSectors>
              <MissionBriefing />
            </RouteGuard>
          } />
          <Route path="/sectors" element={
            <RouteGuard requireUsername requireScan>
              <SectorMap />
            </RouteGuard>
          } />
          <Route path="/sector/:key" element={
            <RouteGuard requireUsername requireScan>
              <SectorDetail />
            </RouteGuard>
          } />
          <Route path="/sector/:key/targets" element={
            <RouteGuard requireUsername requireScan>
              <SectorTargets />
            </RouteGuard>
          } />
          <Route path="/review" element={
            <RouteGuard requireUsername requireScan>
              <OperationReview />
            </RouteGuard>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <FlowProvider>
      <AppInner />
    </FlowProvider>
  </QueryClientProvider>
);
  <QueryClientProvider client={queryClient}>
    <FlowProvider>
      <BrowserRouter>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Boot />} />
            <Route path="/new-user" element={<Boot />} />
            <Route path="/menu" element={
              <RouteGuard requireUsername>
                <MainMenu />
              </RouteGuard>
            } />
            <Route path="/scan" element={
              <RouteGuard requireUsername>
                <Scan />
              </RouteGuard>
            } />
            <Route path="/explainer" element={
              <RouteGuard requireUsername>
                <SystemExplainer />
              </RouteGuard>
            } />
            <Route path="/scenarios" element={<Scenarios />} />
            <Route path="/scenario/:id" element={<ScenarioDetail />} />
            <Route path="/options" element={<Options />} />
            <Route path="/briefing" element={
              <RouteGuard requireUsername requireSectors>
                <MissionBriefing />
              </RouteGuard>
            } />
            <Route path="/sectors" element={
              <RouteGuard requireUsername requireScan>
                <SectorMap />
              </RouteGuard>
            } />
            <Route path="/sector/:key" element={
              <RouteGuard requireUsername requireScan>
                <SectorDetail />
              </RouteGuard>
            } />
            <Route path="/sector/:key/targets" element={
              <RouteGuard requireUsername requireScan>
                <SectorTargets />
              </RouteGuard>
            } />
            <Route path="/review" element={
              <RouteGuard requireUsername requireScan>
                <OperationReview />
              </RouteGuard>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </BrowserRouter>
    </FlowProvider>
);
