import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginApi } from "../api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = "Enter a valid email address";
    }
    if (!password) {
      next.password = "Password is required";
    } else if (password.length < 6) {
      next.password = "Password must be at least 6 characters";
    }
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>TaskFlow</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Sign in to your account
          </p>
        </div>

        <div className="card" style={{ padding: "2rem" }}>
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
                style={errors.email ? inputErrorStyle : undefined}
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
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
                autoComplete="current-password"
                style={errors.password ? inputErrorStyle : undefined}
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
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "0.375rem",
  fontSize: "0.875rem",
  fontWeight: 500,
};

const inputErrorStyle = {
  borderColor: "var(--danger)",
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

export default LoginPage;
