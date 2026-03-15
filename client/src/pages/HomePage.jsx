import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginApi, registerApi } from "../api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const labelStyle = {
  display: "block",
  marginBottom: "0.375rem",
  fontSize: "0.875rem",
  fontWeight: 500,
};

function Required() {
  return (
    <span style={{ color: "var(--danger)", marginLeft: "0.15rem" }} aria-hidden="true">
      *
    </span>
  );
}

function FieldError({ children }) {
  return (
    <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "0.3rem", marginBottom: 0 }}>
      {children}
    </p>
  );
}

function AlertError({ children }) {
  return (
    <p
      style={{
        color: "var(--danger)",
        fontSize: "0.875rem",
        marginBottom: "1rem",
        marginTop: 0,
        padding: "0.5rem 0.75rem",
        background: "rgba(239,68,68,0.1)",
        borderRadius: "6px",
        border: "1px solid rgba(239,68,68,0.25)",
      }}
    >
      {children}
    </p>
  );
}

function GoogleButton() {
  return (
    <button
      type="button"
      style={{ width: "100%", padding: "0.6rem 1rem", marginBottom: "1.25rem", gap: "0.6rem" }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "1.25rem",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        or continue with email
      </span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function TabSwitcher({ active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--surface-2)",
        borderRadius: 8,
        padding: "3px",
        marginBottom: "1.5rem",
        gap: "3px",
      }}
    >
      {[
        { id: "signin", label: "Sign in" },
        { id: "signup", label: "Sign up" },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1,
            border: "none",
            borderRadius: 6,
            padding: "0.45rem 0.75rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
            background: active === tab.id ? "var(--surface)" : "transparent",
            color: active === tab.id ? "var(--text)" : "var(--text-muted)",
            boxShadow: active === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function SignInForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!EMAIL_REGEX.test(email.trim())) next.email = "Enter a valid email address";
    if (!password) next.password = "Password is required";
    else if (password.length < 6) next.password = "Password must be at least 6 characters";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const data = await loginApi(email.trim(), password);
      login(data.token, data.user);
      navigate("/projects");
    } catch (err) {
      setSubmitError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ marginBottom: "1rem" }}>
        <label style={labelStyle}>
          Email <Required />
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          placeholder="you@example.com"
          autoComplete="email"
          style={errors.email ? { borderColor: "var(--danger)" } : undefined}
        />
        {errors.email && <FieldError>{errors.email}</FieldError>}
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.375rem",
          }}
        >
          <label style={{ ...labelStyle, marginBottom: 0 }}>
            Password <Required />
          </label>
          <button
            type="button"
            onClick={() => {}}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "0.8rem",
              color: "var(--accent)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Forgot password?
          </button>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
          placeholder="••••••••"
          autoComplete="current-password"
          style={errors.password ? { borderColor: "var(--danger)" } : undefined}
        />
        {errors.password && <FieldError>{errors.password}</FieldError>}
      </div>

      {submitError && <AlertError>{submitError}</AlertError>}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{ width: "100%", padding: "0.6rem 1rem", fontSize: "0.95rem" }}
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Name is required";
    if (!email.trim()) next.email = "Email is required";
    else if (!EMAIL_REGEX.test(email.trim())) next.email = "Enter a valid email address";
    if (!password) next.password = "Password is required";
    else if (password.length < 6) next.password = "Password must be at least 6 characters";
    if (!confirm) next.confirm = "Please confirm your password";
    else if (confirm !== password) next.confirm = "Passwords do not match";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await registerApi(name.trim(), email.trim(), password);
      setDone(true);
    } catch (err) {
      setSubmitError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "rgba(22,163,74,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p style={{ fontWeight: 600, marginBottom: "0.4rem", marginTop: 0 }}>Account created!</p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>
          Check your inbox to verify your email address.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ marginBottom: "1rem" }}>
        <label style={labelStyle}>
          Name <Required />
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
          }}
          placeholder="Jane Smith"
          autoComplete="name"
          style={errors.name ? { borderColor: "var(--danger)" } : undefined}
        />
        {errors.name && <FieldError>{errors.name}</FieldError>}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={labelStyle}>
          Email <Required />
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          placeholder="you@example.com"
          autoComplete="email"
          style={errors.email ? { borderColor: "var(--danger)" } : undefined}
        />
        {errors.email && <FieldError>{errors.email}</FieldError>}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={labelStyle}>
          Password <Required />
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
          placeholder="••••••••"
          autoComplete="new-password"
          style={errors.password ? { borderColor: "var(--danger)" } : undefined}
        />
        {errors.password && <FieldError>{errors.password}</FieldError>}
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={labelStyle}>
          Confirm Password <Required />
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
          }}
          placeholder="••••••••"
          autoComplete="new-password"
          style={errors.confirm ? { borderColor: "var(--danger)" } : undefined}
        />
        {errors.confirm && <FieldError>{errors.confirm}</FieldError>}
      </div>

      {submitError && <AlertError>{submitError}</AlertError>}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{ width: "100%", padding: "0.6rem 1rem", fontSize: "0.95rem" }}
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function HomePage() {
  const [activeTab, setActiveTab] = useState("signin");

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="home-layout">
        {/* Hero — left column on desktop, top on mobile */}
        <section className="home-hero">
          {/* Wordmark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.01em" }}>
              TaskFlow
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.025em",
              marginBottom: "1rem",
            }}
          >
            Manage projects.
            <br />
            Ship faster.
          </h1>

          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1rem",
              lineHeight: 1.7,
              marginBottom: "2rem",
              maxWidth: 380,
            }}
          >
            TaskFlow keeps your team aligned — from first idea to final delivery. Track
            tasks, set priorities, and hit every deadline.
          </p>

          {/* Feature bullets */}
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.65rem",
            }}
          >
            {[
              "Organize work into projects and tasks",
              "Priority and status tracking at a glance",
              "Real-time analytics for your team",
            ].map((feat) => (
              <li
                key={feat}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "rgba(99,102,241,0.12)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="2 6 5 9 10 3" />
                  </svg>
                </span>
                {feat}
              </li>
            ))}
          </ul>
        </section>

        {/* Auth card — right column on desktop, bottom on mobile */}
        <section className="home-auth">
          <div className="card home-auth-card">
            <GoogleButton />
            <Divider />
            <TabSwitcher active={activeTab} onChange={setActiveTab} />
            {activeTab === "signin" ? <SignInForm /> : <SignUpForm />}
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;