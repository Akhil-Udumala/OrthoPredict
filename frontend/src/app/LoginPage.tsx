import { useState, type FormEvent } from "react";
import { Bone } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/lib/auth";

interface LoginPageProps {
  onAuthenticated: () => void;
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth();

  async function handleEmailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }

      onAuthenticated();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleGoogleAuth() {
    setAuthError(null);
    setIsAuthenticating(true);

    try {
      await signInWithGoogle();
      onAuthenticated();
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsAuthenticating(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .clinical-bg {
            background: radial-gradient(circle at top right, #006061, #004747, #002020);
        }
      `}} />
      <div className="font-body m-0 p-0 min-h-screen overflow-x-hidden bg-[#f9f9fb] text-[#1a1c1d]">
        <main className="relative min-h-screen flex items-center justify-center clinical-bg px-6">
          {/* Abstract Background Imagery */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <img 
              alt="blurred clinical imagery" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGDUyai2ABLmJQh_Z0bE6SgV1l6xADxaYjze-0nmoYkUgsGvBoUbV80cjVlhU0bzHGV4sxe-1R6xgzfJYmNsdmHlC08UjIShIDEROIU3DS1-iVDnbxpC8tlsSqOzWbnzTlv38Y4C4etjcg5tBTo3DOEGADOeLmH5VVn971YZJudmu9KGuBDmVwJydWGlaZH0hGTqOHGhPXKsijMTuAOc5f8BsiyNHZ49Hbb92BUi2JaXrttUaEHidjmGOtRRGB1KBP1L8rkk9snqM"
            />
          </div>

          {/* Design System Top Bar */}
          <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-6 bg-transparent">
            <div className="flex items-center gap-2 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#004747]">
                <Bone className="h-5 w-5" />
              </span>
              <span className="text-xl font-bold tracking-tighter uppercase">OrthoPredict</span>
            </div>
            <div className="hidden md:flex gap-8 text-sm font-medium text-white/70">
              <span className="hover:text-white transition-colors cursor-pointer">Support</span>
              <span className="hover:text-white transition-colors cursor-pointer">Security</span>
            </div>
          </header>

          {/* Glass Login Card */}
          <div className="relative z-10 w-full max-w-[480px]">
            <section className="glass-panel p-10 md:p-14 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
              <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {isSignUp ? "Create Account" : "Clinical Access"}
                </h1>
                <p className="text-[#85dada] font-light leading-relaxed max-w-xs" style={{ fontFamily: 'Manrope, sans-serif' }}>
                  {isSignUp 
                    ? "Register with your credentials to access the orthopedic analytics dashboard." 
                    : "Enter your credentials to access the orthopedic analytics dashboard."}
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleEmailAuth}>
                {isSignUp ? (
                  <div className="space-y-2">
                    <label htmlFor="displayName" className="text-xs font-medium uppercase tracking-[0.1em] text-white/60 ml-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        id="displayName"
                        type="text"
                        autoComplete="name"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="Dr. Avery Chen"
                        className="w-full bg-white/10 border-none rounded-xl py-4 px-5 text-white placeholder-white/30 focus:ring-2 focus:ring-[#9cf1f1] focus:bg-white/20 transition-all text-base outline-none"
                      />
                    </div>
                  </div>
                ) : null}

                {/* Institutional Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-xs font-medium uppercase tracking-[0.1em] text-white/60 ml-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Institutional Email
                  </label>
                  <div className="relative">
                    <input 
                      id="email" 
                      type="email" 
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@institution.edu"
                      className="w-full bg-white/10 border-none rounded-xl py-4 px-5 text-white placeholder-white/30 focus:ring-2 focus:ring-[#9cf1f1] focus:bg-white/20 transition-all text-base outline-none" 
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="password" className="text-xs font-medium uppercase tracking-[0.1em] text-white/60" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Password
                    </label>
                    {!isSignUp && (
                      <a href="#" className="text-xs text-[#9cf1f1] hover:text-white transition-colors">Forgot Access?</a>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      id="password" 
                      type="password" 
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white/10 border-none rounded-xl py-4 px-5 text-white placeholder-white/30 focus:ring-2 focus:ring-[#9cf1f1] focus:bg-white/20 transition-all text-base outline-none" 
                    />
                  </div>
                </div>

                {authError ? (
                  <div className="rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
                    {authError}
                  </div>
                ) : null}

                {/* Sign In Button */}
                <button 
                  type="submit" 
                  disabled={isAuthenticating}
                  className="w-full mt-4 py-4 px-6 rounded-xl bg-gradient-to-br from-[#9cf1f1] to-[#006061] text-[#002020] font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#004747]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isAuthenticating ? "Securing access…" : isSignUp ? "Sign Up" : "Sign In"}
                </button>
              </form>

              <div className="relative my-10 text-center">
                <span className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10 -translate-y-1/2"></span>
                <span className="relative bg-[#0b3131] px-4 text-xs uppercase tracking-widest text-white/40" style={{ fontFamily: 'Manrope, sans-serif' }}>OR</span>
              </div>

              {/* Google Auth */}
              <button 
                type="button"
                onClick={() => void handleGoogleAuth()}
                disabled={isAuthenticating}
                className="w-full py-4 px-6 rounded-xl bg-white text-[#1a1c1d] font-semibold flex items-center justify-center gap-3 hover:bg-[#f3f3f5] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <img 
                  alt="Google Logo" 
                  className="w-5 h-5" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2w9flyHWvq1xIUR01yGq82Bzo70vIEIAqCTbTXu8XyWXXExuZTH24xZnGw__VJ7-MUMV_nxUrZdLPnq7GlB-h2NSqTr0nOMjaJWMr0xggyuEGFjcxRQodHrGhnzgx6NXSqpTjLy8gu2FwsF06Q9Y1DLAVrtZ8mw659Fl7EMREST4fqlou0K1bK3JegR3usAWOG83IH3maQZyJlUNCZfPUuMnTPPEwm0ga3AppMh9NRQCK3J8lnBIvyh6Kb7oOjV_14SLzc7kGqQA"
                />
                {isSignUp ? "Sign up with Google" : "Sign in with Google"}
              </button>

              <div className="mt-10 text-center">
                <p className="text-sm text-white/50">
                  {isSignUp ? "Already a user? " : "New to the platform? "}
                  <button 
                    type="button" 
                    onClick={() => {
                      setAuthError(null);
                      setIsSignUp(!isSignUp);
                    }}
                    className="text-[#9cf1f1] font-semibold hover:underline"
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </button>
                </p>
              </div>
            </section>

            {/* Bottom Floating Trust Tags */}
            <div className="mt-8 flex justify-center gap-6 text-[10px] uppercase tracking-[0.15em] text-white/30" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <div className="flex items-center gap-2">
                HIPAA Compliant
              </div>
              <div className="flex items-center gap-2">
                End-to-End Encryption
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "That email already has an account. Try signing in instead.";
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "The email or password did not match a Firebase account.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was closed before it finished.";
      case "auth/weak-password":
        return "Use a stronger password with at least 6 characters.";
      default:
        return error.message;
    }
  }

  return error instanceof Error ? error.message : "Firebase authentication failed.";
}
