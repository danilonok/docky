import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { copy } from '../config/editions';
import AuthShell from '../components/auth/AuthShell';
import FormError from '../components/auth/FormError';
import { Button, Checkbox, PasswordField, TextField } from '../components/ui';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [keepSignedIn, setKeepSignedIn] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, error, clearError } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const text = copy();

    // Set by the register page on success. Registration does not sign the user
    // in – the API issues no token – so saying so here is what closes the loop.
    const justRegistered = location.state?.registered === true;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        const success = await login(email, password, { keepSignedIn });
        setIsSubmitting(false);
        if (success) navigate('/chats');
    };

    return (
        <AuthShell
            footer={text.tagline}
            aside={
                <div className="flex flex-col gap-[22px]">
                    <h2 className="font-serif text-[40px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink text-pretty">
                        {text.signIn.headline}
                    </h2>
                    <p className="max-w-[380px] text-base leading-[1.65] text-ink-muted text-pretty">
                        {text.signIn.body}
                    </p>
                </div>
            }
        >
            <div className="flex flex-col gap-1.5">
                <h1 className="font-serif text-3xl font-semibold tracking-[-0.01em] text-ink">
                    Welcome back
                </h1>
                <p className="text-[15px] text-ink-faint">Sign in to your Docky account.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
                {justRegistered && (
                    <p className="text-[13px] text-success">Account created. Sign in below.</p>
                )}

                <TextField
                    label="Email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => {
                        setEmail(event.target.value);
                        clearError();
                    }}
                    placeholder="you@example.com"
                />

                <PasswordField
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => {
                        setPassword(event.target.value);
                        clearError();
                    }}
                />

                <label className="flex items-center gap-[9px] text-sm text-ink-muted cursor-pointer">
                    <Checkbox
                        checked={keepSignedIn}
                        onChange={(event) => setKeepSignedIn(event.target.checked)}
                    />
                    Keep me signed in on this device
                </label>

                <FormError>{error}</FormError>

                <Button
                    type="submit"
                    size="lg"
                    id="login-submit-btn"
                    disabled={isSubmitting || !email || !password}
                >
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>

                <p className="text-center text-sm text-ink-faint">
                    No account yet?{' '}
                    <Link to="/register" className="font-semibold text-accent underline">
                        Create one
                    </Link>
                </p>
            </form>
        </AuthShell>
    );
}
