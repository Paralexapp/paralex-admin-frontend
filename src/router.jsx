import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import AdminProtectedRoute from "./layouts/AdminProtectedRoute";
import SignIn from "./auth/SiginIn";
import ErrorPage from "./pages/ErrorPage";
import DashboardLayout from "./layouts/DashboardLayout";

// Pages load on demand so the sign-in screen doesn't ship the charts, PDF tooling, etc.
const page = (load) => async () => ({ Component: (await load()).default });

export const router = createBrowserRouter([
  {
    // Root layout hosts the app-wide toast container
    element: <RootLayout />,
    // First paint while the initial page chunk loads
    hydrateFallbackElement: <div className="min-h-dvh bg-stone-50" />,
    children: [
      {
        path: "/", //Admin Login route
        element: <SignIn />,
      },
      {
        path: "/admin/login",
        element: <SignIn />,
      },
      {
        path: "/admin", //Every Admin related route is prefixed with '/admin'
        element: (
          <AdminProtectedRoute>
            <DashboardLayout />
          </AdminProtectedRoute>
        ),
        children: [
          { index: true, lazy: page(() => import("./pages/Dashboard")) },
          { path: "dashboard", lazy: page(() => import("./pages/Dashboard")) },
          { path: "settings", lazy: page(() => import("./pages/AdminSettings")) },
          { path: "bailbond", lazy: page(() => import("./pages/Bailbond")) },
          { path: "lawyers", lazy: page(() => import("./pages/Lawyers")) },
          { path: "add-lawyer", lazy: page(() => import("./pages/AddLawyer")) },
          { path: "lawyer/:userId", lazy: page(() => import("./pages/LawyerProfile")) },
          { path: "users", lazy: page(() => import("./pages/Users")) },
          { path: "add-user", lazy: page(() => import("./pages/AddUser")) },
          { path: "user/:userId", lazy: page(() => import("./pages/UserProfile")) },
          { path: "drivers", lazy: page(() => import("./pages/Drivers")) },
          { path: "add-driver", lazy: page(() => import("./pages/AddDriver")) },
          { path: "driver/:driverId", lazy: page(() => import("./pages/DriverProfile")) },
          { path: "notifications", lazy: page(() => import("./pages/Notifications")) },
          { path: "logistics", lazy: page(() => import("./pages/DeliveryRequest")) },
          { path: "transaction", lazy: page(() => import("./pages/Transactions")) },
          { path: "bailbond/:id", lazy: page(() => import("./pages/BailBondDetail")) },
          // Old sample-document route; the detail page replaced it
          { path: "bailbonddownload", element: <Navigate to="/admin/bailbond" replace /> },
          { path: "post-news", lazy: page(() => import("./pages/PostNewsForm")) },
        ],
      },
      {
        path: "*",
        element: <ErrorPage />
      },
    ],
  },
]);
