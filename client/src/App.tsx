import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SessionProvider } from "./contexts/SessionContext";
import LandingPage from "./pages/LandingPage";
import DashboardV2 from "./pages/DashboardV2";
import ProjectsDashboard from "./pages/ProjectsDashboard";
import SettingsPage from "./pages/SettingsPage";
import TemplatesPage from "./pages/TemplatesPage";
import MarketplacePage from "./pages/MarketplacePage";
import DeploymentsPage from "./pages/DeploymentsPage";
import BillingPage from "./pages/BillingPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import ProjectBuilder from "./pages/ProjectBuilder";
import ProjectEditor from "./pages/ProjectEditor";
import PromptTemplates from "./pages/PromptTemplates";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";
import UserDashboard from "./pages/UserDashboard";
import ProjectManager from "./pages/ProjectManager";
import AdvancedAIWorkspace from "./pages/AdvancedAIWorkspace";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={EmailVerification} />
      <Route path="/user-dashboard" component={UserDashboard} />
      <Route path="/project-manager" component={ProjectManager} />
      <Route path="/ai-workspace" component={AdvancedAIWorkspace} />
      <Route path="/dashboard" component={DashboardV2} />
      <Route path="/projects" component={ProjectsDashboard} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/deployments" component={DeploymentsPage} />
      <Route path="/billing" component={BillingPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/project-builder" component={ProjectBuilder} />
      <Route path="/projects/:id/editor" component={ProjectEditor} />
      <Route path="/prompt-templates" component={PromptTemplates} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <SessionProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SessionProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
