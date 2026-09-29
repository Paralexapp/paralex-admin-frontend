import { useEffect, useState } from "react";
import { PiEnvelopeSimple, PiLockSimple, PiEye, PiEyeSlash, PiGavel, PiScales, PiPackage } from "react-icons/pi";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/favicon.png";
import logoLight from "../assets/logz.png";
import { handleAdminLogin } from "../api/api";
import { getAdminToken, setAdminToken } from "../api/authHelper";
import Button from "../components/ui/Button";
import { Field, Input } from "../components/ui/Form";

const highlights = [
  { icon: PiGavel, text: "Review and onboard lawyers" },
  { icon: PiScales, text: "Track bail bond requests end to end" },
  { icon: PiPackage, text: "Keep an eye on deliveries and riders" },
];

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Set by the API layer when a request comes back 401
  useEffect(() => {
    if (searchParams.get("message") === "admin-session-expired") {
      toast.info("Your session has expired. Please sign in again.", { toastId: "sessionExpired" });
    }
  }, [searchParams]);

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await handleAdminLogin({ email: email.trim(), password });
      setAdminToken(response.token, remember);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.error || "We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Already signed in - skip the login form
  if (getAdminToken()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-40 -left-40 size-[560px] rounded-full bg-[radial-gradient(circle,rgb(127_58_132/0.55),transparent_65%)]" />
        <div className="pointer-events-none absolute -right-32 -bottom-48 size-[480px] rounded-full bg-[radial-gradient(circle,rgb(216_27_96/0.22),transparent_65%)]" />

        <img src={logoLight} alt="Paralex" className="relative h-9 w-auto self-start" />

        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">Manage Paralex app in one Dashboard</h1>
          <ul className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-brand-100">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="size-[18px]" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-brand-300/70">© {new Date().getFullYear()} Paralex Logistics</p>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <img src={logo} alt="Paralex" className="mb-10 h-10 w-auto lg:hidden" />

          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Sign in</h2>
          <p className="mt-1.5 text-sm text-stone-500">Use your Paralex admin account.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div role="alert" className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200 ring-inset">
                {error}
              </div>
            )}

            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                icon={PiEnvelopeSimple}
                placeholder="you@paralexlogistics.com"
                value={email}
                onChange={(evt) => setEmail(evt.target.value)}
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  icon={PiLockSimple}
                  placeholder="Your password"
                  className="pr-10"
                  value={password}
                  onChange={(evt) => setPassword(evt.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((show) => !show)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? <PiEyeSlash className="size-4" /> : <PiEye className="size-4" />}
                </button>
              </div>
            </Field>

            <label className="flex items-center gap-2.5 text-sm text-stone-600 select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(evt) => setRemember(evt.target.checked)}
                className="size-4 rounded border-stone-300 accent-brand-900"
              />
              Keep me signed in on this device
            </label>

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default SignIn;
