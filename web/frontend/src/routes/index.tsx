import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import InterviewLayout from '../layouts/InterviewLayout';
import ToastContainer from '../components/common/ToastContainer';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import NeuralLoader from '../components/common/NeuralLoader';

import LandingPage from '../pages/Landing';
import StaticPage from '../pages/Static';
import NotFoundPage from '../pages/NotFound';

const LoginPage = lazy(() => import('../pages/Auth/Login'));
const SignupPage = lazy(() => import('../pages/Auth/Signup'));
const ForgotPasswordPage = lazy(() => import('../pages/Auth/ForgotPassword'));
const DashboardPage = lazy(() => import('../pages/Dashboard'));
const ResumeUploadPage = lazy(() => import('../pages/ResumeUpload'));
const InterviewSetupPage = lazy(() => import('../pages/InterviewSetup'));
const MockInterviewPage = lazy(() => import('../pages/MockInterview'));
const FeedbackPage = lazy(() => import('../pages/Feedback'));
const AnalyticsPage = lazy(() => import('../pages/Analytics'));
const SettingsPage = lazy(() => import('../pages/Settings'));
const CompanyPrepPage = lazy(() => import('../pages/CompanyPrep'));

const withSuspense = (element: ReactNode) => (
  <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><NeuralLoader message="Loading view..." /></div>}>
    {element}
  </Suspense>
);

const TERMS_CONTENT = `Welcome to PrepMate AI! These Terms and Conditions outline the rules, regulations, and guidelines for using our website and services. By accessing or using our platform, you agree to be bound by these Terms.

## Acceptance of Terms
By creating an account, accessing the platform, or utilizing any of our features, you expressly agree to comply with these terms. If you do not agree with any part of these terms, you must immediately discontinue the use of our services. These terms form a legally binding agreement between you and PrepMate AI.

## Description of Service
PrepMate AI is an AI-driven interview preparation platform designed to simulate real-world technical and behavioral interviews. We offer features such as resume analysis, skill extraction, customized mock interview sessions, real-time voice interaction, and comprehensive feedback reports. Our services are intended solely for educational and preparatory purposes. We do not guarantee employment, job offers, or specific performance outcomes in actual interviews.

## User Accounts and Responsibilities
To unlock the full potential of our platform, you are required to register for an account. You agree to:
- Provide accurate, current, and complete information during registration.
- Maintain the security of your password and account credentials.
- Take full responsibility for all activities that occur under your account.
- Notify us immediately of any unauthorized use or suspected security breach.

## Acceptable Use and Platform Integrity
We strive to maintain a safe and productive environment. You agree not to:
- Use the platform for any unlawful, misleading, or fraudulent purpose.
- Upload viruses, malicious code, or attempt to disable, overburden, or impair the proper working of the platform.
- Scrape, data-mine, or automatically collect information from our services without explicit permission.
- Attempt to reverse engineer, decompile, or bypass the AI orchestration and fallback stack.
Any violation may result in immediate suspension or termination of your account without notice.

## Intellectual Property Rights
All proprietary content, software architecture, UI/UX designs, logos, and documentation belong exclusively to PrepMate AI. Your personal data, uploaded resumes, and interview responses remain your intellectual property. By uploading your resume, you grant us a temporary, limited license to process the document solely to provide our AI analysis services.

## Modifications to the Service and Terms
We are constantly improving PrepMate AI. We reserve the right to modify, suspend, or discontinue any feature or part of the service at any time. We may also update these Terms periodically. Continued use of the platform following any modifications constitutes acceptance of the new Terms.

## Limitation of Liability
The services are provided on an "as is" and "as available" basis. PrepMate AI, its developers, and partners shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from your use or inability to use the platform, including but not limited to lost job opportunities or data loss.

If you have any questions or concerns regarding these Terms, please reach out to us via the Contact page.`;

const PRIVACY_CONTENT = `Your privacy is of the utmost importance to us at PrepMate AI. This Privacy Policy explains how we collect, use, protect, and handle your personal data when you use our platform. We are committed to transparency and strict data minimization.

## Information We Collect
We collect information that you willingly provide and data generated through your interaction with our services:
- **Personal Identifiers:** Name, email address, and authentication tokens (via Firebase or our JWT system).
- **Career Documents:** Resumes and CVs uploaded for parsing and skill extraction.
- **Interview Data:** Spoken audio transcripts (via Web Speech API), text answers, selected preferences (role, difficulty, company), and the resulting AI-generated feedback.
- **Usage Data:** Information on how you navigate the platform, session durations, and interaction with specific UI components to help us improve the system.

## How We Use Your Information
Your data is utilized strictly to provide, personalize, and improve your experience:
- To operate the core AI interview engine and generate actionable, personalized feedback reports.
- To track your progress over time via our Analytics Dashboard.
- To communicate with you regarding platform updates, security alerts, and account maintenance.
- To debug issues and optimize our system design and fallback orchestration mechanisms.

## AI Processing, Data Security, and Third Parties
To provide our intelligent services, your inputs (such as resume text and transcribed interview answers) are processed by our AI fallback stack (including Gemini, Groq, OpenRouter, and Cerebras).
- **Data Sanitization:** We redact obvious contact identifiers (email addresses and phone numbers) from resume text before sending it to our AI partners.
- **No Data Selling:** We never sell your personal data. Your data is never shared with third-party marketers, advertisers, or external recruiters.
- **Transport & Storage:** Data is transmitted over HTTPS and stored securely in our application database.

## Cookies and Tracking Technologies
We use cookies and browser storage (including Zustand persistence) to:
- Maintain secure, continuous sessions as you navigate between the dashboard and active interviews.
- Remember your theme preferences (light/dark/system mode) and accessibility settings.
- Analyze platform performance. You can manage browser storage and cookies via your browser settings.

## Your Data Rights
You retain complete control over your digital footprint on PrepMate AI:
- **Access and Update:** You can view and modify your profile details at any time in Settings.
- **Data Portability:** You can export your feedback reports directly from each session results page.
- **Right to Erasure:** You can permanently delete your uploaded resumes or your entire account and associated data directly from Settings.

## Changes to This Privacy Policy
We may update this policy as our platform evolves or legal requirements change. Significant updates will be communicated via email or a prominent notice on the platform.

For any privacy-related inquiries, please contact our Data Protection Officer at privacy@prepmateai.com.`;

const COOKIE_CONTENT = `Learn how PrepMate AI uses cookies and local storage to keep your sessions secure and remember your preferences.

## What Are Cookies?
Cookies are small text files stored on your computer or mobile device when you visit a website. They help the application remember your actions and preferences (such as theme selection and consent state) over a period of time.

## How We Use Cookies
- **Essential Cookies & Storage:** Strictly necessary for core functionality, such as maintaining authenticated sessions and storing your preparation preferences as you navigate between the dashboard and mock interviews.
- **Performance Analytics:** Helps us understand how visitors interact with our platform so we can diagnose errors and improve the overall experience.

## Your Choices
You can control and manage cookies or site storage through your browser settings at any time. Blocking essential storage may prevent you from signing in or preserving interview progress.`;

const SYSTEM_DESIGN_CONTENT = `Mastering system design is crucial for senior engineering roles. Use this structured approach to tackle open-ended architecture rounds clearly and systematically.

## Understand the Requirements
Never start drawing boxes immediately. Spend the first 5 to 10 minutes clarifying the functional requirements (what the system should do) and non-functional requirements (scale, latency targets, availability, and consistency guarantees).

## Back-of-the-Envelope Estimation
Calculate expected read/write ratios, queries per second (QPS), storage growth, and network bandwidth. Clear estimates show the interviewer you understand the real-world scale constraints before committing to components.

## High-Level Design
Sketch the core end-to-end architecture: client applications, DNS/CDN, load balancer, API gateway, stateless application services, and primary data stores. Keep the baseline clean and verify the happy path first.

## Deep Dive & Bottlenecks
Once the baseline architecture is aligned, inspect bottleneck areas: database sharding and indexing, caching layers (such as Redis), asynchronous message queues (such as Kafka), rate limiting, and graceful failure recovery.

Practice these steps interactively using our Mock Interview tool to refine your pacing.`;

const BEHAVIORAL_CONTENT = `Behavioral interviews evaluate how you collaborate, navigate conflict, and deliver outcomes under real constraints. Use the STAR framework to keep every answer structured and impact-focused.

## The STAR Method
- **Situation:** Briefly set the context and stakes of the project or event.
- **Task:** Clarify what responsibility or challenge belonged directly to you.
- **Action:** Explain the concrete steps you personally took—emphasize "I" over "We" and explain key trade-offs.
- **Result:** Share measurable outcomes, lessons learned, and what changed afterward.

## Common Themes to Prepare For
- **Leadership:** "Tell me about a time you led a difficult cross-team initiative."
- **Conflict Resolution:** "Describe a situation where you disagreed technically with a teammate."
- **Failure & Ownership:** "Tell me about a mistake you made in production and what changed afterward."
- **Ambiguity:** "How do you make progress when requirements are incomplete or shifting?"

Use PrepMate AI behavioral mock interviews to practice delivering concise STAR stories with timed feedback.`;

const BLOG_CONTENT = `Articles and practical engineering playbooks on technical interviewing, resume optimization, and modern architecture.

## Upcoming Topics
- How to Structure Resume Impact Bullets for Modern ATS Scanners
- Core System Design Patterns Every Senior Engineer Should Know
- Overcoming Interview Pressure Through Deliberate Timed Practice
- Inside PrepMate AI's Multi-Provider LLM Fallback Architecture

Check back soon for our upcoming deep-dive posts.`;

const HELP_CONTENT = `Answers to the most common questions about running mock interviews, analyzing your resume, and configuring audio features on PrepMate AI.

## How do I start a mock interview?
Navigate to your Dashboard and click "Start Practice" (or go to Practice Interview in the top bar). Choose your target role, company focus, rigor level, and optional job description before launching the timed session.

## Can I use PrepMate AI for non-technical roles?
Yes. While we specialize in Software Engineering and System Design, PrepMate AI dynamically adapts questions and rubrics for behavioral rounds, Product Management, Data Science, and related roles.

## Is my resume data secure?
Yes. Before sending resume text to our AI providers for skill extraction and ATS audit, PrepMate AI redacts obvious contact identifiers such as email addresses and phone numbers. You can also permanently delete uploaded resumes or your entire account from Settings.

## AI voice or microphone input isn't working. What should I do?
Check that your browser allows audio playback and microphone permissions for the site, confirm you are using a supported browser (such as Chrome or Edge for Web Speech API dictation), and interact with the page before clicking speak controls.

If you need further assistance, please visit our Contact page.`;

const CONTACT_CONTENT = `Whether you have a question about a feature, need technical support, or want to share feedback about your mock interview experience, reach out to our team below.

## Customer Support
- **Email:** support@prepmateai.com
- **Response Time:** We aim to respond to all inquiries within 24 hours.

## Business Inquiries
For enterprise partnerships, bootcamps, or university licensing:
- **Email:** enterprise@prepmateai.com

## Mailing Address
PrepMate AI Headquarters, 123 Innovation Drive, Suite 400, San Francisco, CA 94105.`;

const CAREERS_CONTENT = `We are on a mission to make realistic, high-signal interview preparation accessible to candidates everywhere.

## Why Join Us?
At PrepMate AI, you work on real-time voice workflows, multi-provider LLM orchestration with low-latency fallbacks, resume intelligence pipelines, and clean responsive interfaces. We value ownership, technical depth, and continuous learning.

## Current Openings
While we do not have listed openings at this exact moment, we are always glad to hear from thoughtful Full-Stack Engineers, Applied AI Engineers, and Product Designers at careers@prepmateai.com.`;

const ABOUT_CONTENT = `Technical and behavioral interviews often come with unclear expectations and zero actionable feedback. We built PrepMate AI to give every candidate a focused, private space to practice effectively.

## Our Mission
We believe everyone deserves the chance to practice deliberately, spot blind spots early, and build confidence before the real interview conversation.

## How It Works
- **Resume Intelligence:** Parse PDF or DOCX resumes cleanly, extract matching skills, and get concrete ATS optimization suggestions.
- **Role & Company Calibration:** Tailor questions to target companies, specific job descriptions, and difficulty levels.
- **Multi-Stage Evaluation:** Practice via text or voice with structured scorecards, strengths, improvements, and analytics trends over time.`;

import ScrollToTop from '../components/common/ScrollToTop';
import CookieBanner from '../components/common/CookieBanner';

// Root Wrapper to provide global systems
function RootWrapper() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
      <ToastContainer />
      <CookieBanner />
    </>
  );
}

// Global Layout for all pages
function GlobalLayout() {
  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Navbar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Outlet />
        <Footer />
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootWrapper />,
    children: [
      {
        element: <GlobalLayout />,
        children: [
          { path: '/', element: <LandingPage /> },
          { path: '/terms', element: <StaticPage title="Terms of Service" content={TERMS_CONTENT} /> },
          { path: '/privacy', element: <StaticPage title="Privacy Policy" content={PRIVACY_CONTENT} /> },
          { path: '/cookie-policy', element: <StaticPage title="Cookie Policy" content={COOKIE_CONTENT} /> },
          { path: '/cookies', element: <Navigate to="/cookie-policy" replace /> },
          { path: '/system-design', element: <StaticPage title="System Design Guide" content={SYSTEM_DESIGN_CONTENT} /> },
          { path: '/behavioral', element: <StaticPage title="Behavioral Questions" content={BEHAVIORAL_CONTENT} /> },
          { path: '/blog', element: <StaticPage title="PrepMate AI Blog" content={BLOG_CONTENT} /> },
          { path: '/help', element: <StaticPage title="Help Center" content={HELP_CONTENT} /> },
          { path: '/contact', element: <StaticPage title="Contact Us" content={CONTACT_CONTENT} /> },
          { path: '/careers', element: <StaticPage title="Careers" content={CAREERS_CONTENT} /> },
          { path: '/about', element: <StaticPage title="About Us" content={ABOUT_CONTENT} /> },
          
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', element: withSuspense(<LoginPage />) },
              { path: 'signup', element: withSuspense(<SignupPage />) },
              { path: 'forgot', element: withSuspense(<ForgotPasswordPage />) },
            ],
          },
          {
            element: <AppLayout />,
            children: [
              { path: 'dashboard', element: withSuspense(<DashboardPage />) },
              { path: 'resume', element: withSuspense(<ResumeUploadPage />) },
              { path: 'interview/setup', element: withSuspense(<InterviewSetupPage />) },
              { path: 'feedback/:id', element: withSuspense(<FeedbackPage />) },
              { path: 'analytics', element: withSuspense(<AnalyticsPage />) },
              { path: 'settings', element: withSuspense(<SettingsPage />) },
              { path: 'company-prep', element: withSuspense(<CompanyPrepPage />) },
            ],
          },
        ]
      },
      {
        element: <InterviewLayout />,
        children: [
          { path: 'interview/session', element: withSuspense(<MockInterviewPage />) },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
