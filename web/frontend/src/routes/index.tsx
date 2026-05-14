import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import InterviewLayout from '../layouts/InterviewLayout';

import LandingPage from '../pages/Landing';
import LoginPage from '../pages/Auth/Login';
import SignupPage from '../pages/Auth/Signup';
import DashboardPage from '../pages/Dashboard';
import ResumeUploadPage from '../pages/ResumeUpload';
import InterviewSetupPage from '../pages/InterviewSetup';
import MockInterviewPage from '../pages/MockInterview';
import FeedbackPage from '../pages/Feedback';
import AnalyticsPage from '../pages/Analytics';
import SettingsPage from '../pages/Settings';
import CompanyPrepPage from '../pages/CompanyPrep';
import StaticPage from '../pages/Static';

const TERMS_CONTENT = `Welcome to PrepMate AI. By using our platform, you agree to these terms...

1. Acceptance of Terms
By accessing or using our services, you agree to be bound by these Terms and Conditions.

2. Description of Service
PrepMate AI provides AI-powered interview preparation tools. We do not guarantee employment or interview success.

3. User Conduct
You agree not to misuse the services or help anyone else do so.`;

const PRIVACY_CONTENT = `Your privacy is important to us.

1. Information We Collect
We collect information you provide directly to us, such as when you create an account, upload a resume, or participate in mock interviews.

2. How We Use Information
We use the information we collect to provide, maintain, and improve our services, including training our AI models (with personal identifiers stripped).`;

const HELP_CONTENT = `Help Center

How do I start a mock interview?
Navigate to the Dashboard and click "Start Interview". You can configure your target company and role.

Is my resume data secure?
Yes, resumes are securely processed and used only for your active session analysis.`;

const CONTACT_CONTENT = `Contact Us

We'd love to hear from you. 
Email: support@prepmate.ai
Address: 123 Innovation Drive, Tech City, CA 94000`;

const CAREERS_CONTENT = `Careers at PrepMate AI

We are building the future of career advancement. While we don't have any open positions right now, we are always looking for passionate engineers and designers.

Check back soon!`;

const ABOUT_CONTENT = `About PrepMate AI

PrepMate AI was founded on a simple principle: interview preparation should be adaptive, intelligent, and noise-free. 
We leverage state-of-the-art LLMs to create hyper-realistic interview scenarios, giving candidates the edge they need in competitive markets.`;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  { path: '/terms', element: <StaticPage title="Terms & Conditions" content={TERMS_CONTENT} /> },
  { path: '/privacy', element: <StaticPage title="Privacy Policy" content={PRIVACY_CONTENT} /> },
  { path: '/help', element: <StaticPage title="Help Center" content={HELP_CONTENT} /> },
  { path: '/contact', element: <StaticPage title="Contact" content={CONTACT_CONTENT} /> },
  { path: '/careers', element: <StaticPage title="Careers" content={CAREERS_CONTENT} /> },
  { path: '/about', element: <StaticPage title="About Us" content={ABOUT_CONTENT} /> },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'resume', element: <ResumeUploadPage /> },
      { path: 'interview/setup', element: <InterviewSetupPage /> },
      { path: 'feedback/:id', element: <FeedbackPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'company-prep', element: <CompanyPrepPage /> },
    ],
  },
  {
    element: <InterviewLayout />,
    children: [
      { path: 'interview/session', element: <MockInterviewPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
