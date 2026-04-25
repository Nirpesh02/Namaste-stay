import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader, Lock, Mail, RefreshCcw, ShieldCheck, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/Alert";

export default function Login() {
  const navigate = useNavigate();
  const {
    registerWithEmail,
    verifyEmailCode,
    resendVerificationCode,
    loginWithEmailPassword,
    adminLogin,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [banner, setBanner] = useState(null);

  const destination = userType === "owner" ? "/owner-dashboard" : userType === "admin" ? "/admin-dashboard" : "/";

  const showBanner = (type, title, message) => {
    setBanner({ type, title, message });
  };

  const clearBanner = () => setBanner(null);

  const resetRegistrationFields = () => {
    setName("");
    setPassword("");
    setConfirmPassword("");
  };

  const resetSignInFields = () => {
    setSignInPassword("");
  };

  const navigateToDestination = () => {
    navigate(destination);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    clearBanner();

    if (!email || !signInPassword) {
      showBanner("error", "Missing details", "Enter your email and password to sign in.");
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithEmailPassword({
        email,
        password: signInPassword,
        accountType: userType || "user",
      });

      if (result.success) {
        navigateToDestination();
        return;
      }

      showBanner("error", "Sign-in failed", result.message);

      if (result.message === "Please verify your email before signing in") {
        const resendResult = await resendVerificationCode(email);
        if (resendResult.success) {
          setVerificationEmail(email.trim().toLowerCase());
          setVerificationCode("");
          setVerificationStep(true);
          showBanner(
            "info",
            "Verification required",
            `A fresh verification code was generated for ${email.trim().toLowerCase()}.`,
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearBanner();

    if (!name || !email || !password || !confirmPassword) {
      showBanner("error", "Missing details", "Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      showBanner("error", "Password mismatch", "Passwords don't match.");
      return;
    }

    if (password.length < 6) {
      showBanner("error", "Weak password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerWithEmail({
        name,
        email,
        password,
        accountType: userType || "user",
      });

      if (!result.success) {
        showBanner("error", "Registration failed", result.message);
        return;
      }

      setVerificationEmail(result.email || email.trim().toLowerCase());
      setVerificationCode("");
      setVerificationStep(true);
      const otpHint = result.fallbackOtp ? ` Dev OTP: ${result.fallbackOtp}` : "";
      showBanner(
        "success",
        "Verification code created",
        `A 6-digit code was sent to ${result.email || email.trim().toLowerCase()}. Enter it below to activate your account.${otpHint}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    clearBanner();

    if (!verificationEmail || !verificationCode) {
      showBanner("error", "Missing code", "Enter the verification code sent to your email.");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmailCode(verificationEmail, verificationCode.trim());

      if (!result.success) {
        showBanner("error", "Verification failed", result.message);
        return;
      }

      showBanner("success", "Email verified", "Your account is now active.");
      setVerificationStep(false);
      setIsRegister(false);
      setVerificationCode("");
      resetRegistrationFields();
      resetSignInFields();

      setTimeout(() => navigateToDestination(), 700);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    clearBanner();

    if (!verificationEmail) {
      showBanner("error", "No email selected", "Start registration again to resend a code.");
      return;
    }

    const result = await resendVerificationCode(verificationEmail);
    if (!result.success) {
      showBanner("error", "Could not resend code", result.message);
      return;
    }

    setVerificationCode("");
    const otpHint = result.fallbackOtp ? ` Dev OTP: ${result.fallbackOtp}` : "";
    showBanner("info", "Code resent", `A fresh verification code was sent to ${verificationEmail}.${otpHint}`);
  };

  if (userType === null) {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">Namaste Stay</h1>
              <p className="text-sm text-gray-600">Nepal's Premier Booking Platform</p>
              <p className="text-xs text-red-600 font-semibold">Select Your Account Type</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setUserType("user")}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all text-left group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600">Guest Login</h3>
                    <p className="text-sm text-gray-600 mt-1">Book stays and manage reservations</p>
                  </div>
                  <ArrowRight className="text-red-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => setUserType("owner")}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">Owner/Property Manager</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage hotels and view bookings</p>
                  </div>
                  <ArrowRight className="text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => setUserType("admin")}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600">Admin Dashboard</h3>
                    <p className="text-sm text-gray-600 mt-1">System administration & analytics</p>
                  </div>
                  <ArrowRight className="text-emerald-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>Choose your account type to continue</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="text-red-600 hover:text-red-700 font-semibold text-sm">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (userType === "user") {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {verificationStep ? "Verify Email" : isRegister ? "Create Account" : "Guest Login"}
              </h1>
              <p className="text-gray-600 text-sm">
                {verificationStep
                  ? "Enter the code sent to your inbox"
                  : isRegister
                  ? "Join Namaste Stay to book stays"
                  : "Sign in to book and manage stays"}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="text-center">
                <h2 className="text-3xl font-black text-red-700">Namaste Stay</h2>
                <p className="text-xs text-red-600 font-semibold">Nepal</p>
              </div>
            </div>

            {banner && <Alert type={banner.type} title={banner.title} message={banner.message} onDismiss={clearBanner} />}

            {verificationStep ? (
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-semibold">
                    <ShieldCheck size={18} />
                    Verify your email
                  </div>
                  <p className="text-sm text-red-900">
                    Enter the 6-digit code sent to <span className="font-semibold">{verificationEmail}</span>.
                  </p>

                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent tracking-widest text-center"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Email</span>
                  )}
                </button>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="inline-flex items-center gap-2 text-red-600 font-semibold hover:text-red-700"
                  >
                    <RefreshCcw size={16} />
                    Resend code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationStep(false);
                      setVerificationCode("");
                      clearBanner();
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Back to forms
                  </button>
                </div>
              </form>
            ) : !isRegister ? (
              <>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="password"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign in</span>
                    )}
                  </button>
                </form>

                <div className="text-center text-sm">
                  <p className="text-gray-600">
                    Don't have an account?{" "}
                    <button
                      onClick={() => {
                        setIsRegister(true);
                        clearBanner();
                        resetSignInFields();
                      }}
                      className="text-red-600 font-semibold hover:text-red-700 underline"
                    >
                      Create one
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-linear-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </form>

                <div className="text-center text-sm">
                  <p className="text-gray-600">
                    Already have an account?{" "}
                    <button
                      onClick={() => {
                        setIsRegister(false);
                        clearBanner();
                        resetRegistrationFields();
                        resetSignInFields();
                      }}
                      className="text-red-600 font-semibold hover:text-red-700 underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </>
            )}

           

           

            <button
              onClick={() => {
                setUserType(null);
                setIsRegister(false);
                setVerificationStep(false);
                setVerificationEmail("");
                setVerificationCode("");
                clearBanner();
                resetRegistrationFields();
                resetSignInFields();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="text-red-600 hover:text-red-700 font-semibold text-sm">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (userType === "owner") {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Property Owner Login</h1>
              <p className="text-gray-600 text-sm">Manage your hotels and bookings</p>
            </div>

            <div className="flex justify-center">
              <div className="text-center">
                <h2 className="text-3xl font-black text-blue-700">Namaste Stay</h2>
                <p className="text-xs text-blue-600 font-semibold">Partners</p>
              </div>
            </div>

            {banner && <Alert type={banner.type} title={banner.title} message={banner.message} onDismiss={clearBanner} />}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
              </div>
            </div>

            

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@hotel.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in with Email</span>
                )}
              </button>
            </form>



            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800">
              <p className="font-semibold mb-2">Property Owner Benefits:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>List and manage multiple properties</li>
                <li>Track guest bookings and payments</li>
                <li>Respond to guest reviews</li>
                <li>Access performance analytics</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setUserType(null);
                clearBanner();
                resetSignInFields();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN LOGIN
  if (userType === "admin") {
    const handleAdminLogin = async (e) => {
      e.preventDefault();
      clearBanner();
      if (!email || !signInPassword) {
        showBanner("error", "Missing details", "Enter admin email and password.");
        return;
      }
      setLoading(true);
      try {
        const result = await adminLogin({ email, password: signInPassword });
        if (result.success) {
          navigate("/admin-dashboard");
          return;
        }
        showBanner("error", "Login failed", result.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
              <p className="text-gray-600 text-sm">Access the admin dashboard</p>
            </div>
            <div className="flex justify-center">
              <div className="text-center">
                <h2 className="text-3xl font-black text-emerald-700">Namaste Stay</h2>
                <p className="text-xs text-emerald-600 font-semibold">Administration</p>
              </div>
            </div>
            {banner && <Alert type={banner.type} title={banner.title} message={banner.message} onDismiss={clearBanner} />}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Admin Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hotels@nepal.com" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input type="password" value={signInPassword} onChange={(e) => setSignInPassword(e.target.value)} placeholder="Admin password" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-linear-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? (<><Loader size={18} className="animate-spin" /><span>Signing in...</span></>) : (<span>Sign in as Admin</span>)}
              </button>
            </form>
            <button onClick={() => { setUserType(null); clearBanner(); resetSignInFields(); }} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50">← Back</button>
          </div>
          <div className="mt-6 text-center">
            <a href="/" className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm">← Back to Home</a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
