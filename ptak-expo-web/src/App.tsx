import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import "./global.scss";
import LoginPage from "./pages/loginPage/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EventHomePage from "./pages/EventHomePage";
import EventNewsPage from "./pages/EventNewsPage";
import EventIdentifierPage from "./pages/EventIdentifierPage";
import EventInvitationsPage from "./pages/EventInvitationsPage";
import TradeInfoRoutePage from "./pages/tradeInfoPage/TradeInfoRoutePage";
import ChecklistRoutePage from "./pages/ChecklistRoutePage";
import DocumentsRoutePage from "./pages/DocumentsRoutePage";
import MarketingRoutePage from "./pages/marketingPage/MarketingRoutePage";
import RssEventsPage from "./pages/RssEventsPage";
import RssEventExhibitorsPage from "./pages/RssEventExhibitorsPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:eventId"
              element={
                <ProtectedRoute>
                  <EventHomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:eventId/home"
              element={
                <ProtectedRoute>
                  <EventHomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:eventId/news"
              element={
                <ProtectedRoute>
                  <EventNewsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:eventId/identifier"
              element={
                <ProtectedRoute>
                  <EventIdentifierPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:eventId/invitations"
              element={
                <ProtectedRoute>
                  <EventInvitationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:eventId/trade-info"
              element={
                <ProtectedRoute>
                  <TradeInfoRoutePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:eventId/checklist"
              element={
                <ProtectedRoute>
                  <ChecklistRoutePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:eventId/documents"
              element={
                <ProtectedRoute>
                  <DocumentsRoutePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:eventId/marketing"
              element={
                <ProtectedRoute>
                  <MarketingRoutePage />
                </ProtectedRoute>
              }
            />

            {/* RSS pages - public */}
            <Route path="/rss" element={<RssEventsPage />} />
            <Route
              path="/rss/event/:exhibitionId"
              element={<RssEventExhibitorsPage />}
            />
            
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
