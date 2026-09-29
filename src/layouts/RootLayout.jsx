import { Outlet, useNavigation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/** RootLayout - wraps every route so toasts work on all pages from a single container */
const RootLayout = () => {
  const navigation = useNavigation();

  return (
    <>
      {/* Thin progress bar while a lazily loaded page is on its way */}
      {navigation.state === "loading" && (
        <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-brand-100" role="progressbar" aria-label="Loading page">
          <div className="h-full w-1/3 animate-[loading-bar_1s_ease-in-out_infinite] bg-brand-700" />
        </div>
      )}
      <Outlet />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

export default RootLayout;
