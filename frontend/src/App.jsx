import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import CareerDNA from './pages/CareerDNA';
import Results from './pages/Results';
import Roadmap from './pages/Roadmap';
import JobsPage from './pages/Jobs';

import MarketInsights from './pages/MarketInsights';
import MentorChat from './pages/MentorChat';
import SkillGap from './pages/SkillGap';
import CareerSimulator from './pages/CareerSimulator';
import Profile from './pages/Profile';
import ResumeBuilder from './pages/ResumeBuilder';
import PublicResume from './pages/PublicResume';
import MockInterviewSetup from './pages/MockInterviewSetup';
import InterviewRoom from './pages/InterviewRoom';
import InterviewReport from './pages/InterviewReport';
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/resume/view/:token" element={<PublicResume />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/career-dna" element={<ProtectedRoute><CareerDNA /></ProtectedRoute>} />
          <Route path="/career-predictor" element={<Navigate to="/career-dna" replace />} />
          <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/roadmaps" element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><JobsPage /></ProtectedRoute>} />

          <Route path="/mentor" element={<ProtectedRoute><MentorChat /></ProtectedRoute>} />
          <Route path="/market-intelligence" element={<ProtectedRoute><MarketInsights /></ProtectedRoute>} />
          <Route path="/market-insights" element={<Navigate to="/market-intelligence" replace />} />
          <Route path="/skill-gap" element={<ProtectedRoute><SkillGap /></ProtectedRoute>} />
          <Route path="/career-simulator" element={<ProtectedRoute><CareerSimulator /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
          <Route path="/mock-interview/setup" element={<ProtectedRoute><MockInterviewSetup /></ProtectedRoute>} />
          <Route path="/mock-interview/room" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
          <Route path="/mock-interview/report" element={<ProtectedRoute><InterviewReport /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
