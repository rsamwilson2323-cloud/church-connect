import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";

// Pages
import Dashboard from "@/pages/Dashboard";
import Attendance from "@/pages/Attendance";
import Members from "@/pages/Members";
import Classes from "@/pages/Classes";
import Reports from "@/pages/Reports";
import Login from "@/pages/Login";
import Settings from "@/pages/Settings";

function ProtectedRoute({ component: Component, ...rest }: { component: any, path: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/">
        <ProtectedRoute component={Dashboard} path="/" />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={Attendance} path="/attendance" />
      </Route>
      <Route path="/members">
        <ProtectedRoute component={Members} path="/members" />
      </Route>
      <Route path="/classes">
        <ProtectedRoute component={Classes} path="/classes" />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} path="/reports" />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} path="/settings" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
