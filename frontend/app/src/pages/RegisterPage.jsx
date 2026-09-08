import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { copy } from '../config/editions';
import { passwordStrength } from '../lib/password';
import AuthShell from '../components/auth/AuthShell';
import FormError from '../components/auth/FormError';
import { Button, PasswordField, StrengthMeter, TextField } from '../components/ui';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, error, clearError } = useAuth();
    const navigate = useNavigate();
    const text = copy();

    const strength = passwordStrength(password);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        const success = await register(email, password);
        setIsSubmitting(false);
        if (success) navigate('/login', { state: { registered: true } });
    };

    return (
        <AuthShell
            back={
                <Link to="/login" className="inline-flex items-center gap-3 text-sm text-ink-faint">
                    <span aria-hidden="true" className="text-xl leading-none">
                        ‹
                    </span>
                    Sign in
                </Link>
            }
            aside={
                <div className="flex flex-col gap-6">
                    <h2 className="font-serif text-[40px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink text-pretty">
                        {text.register.headline}
                    </h2>
                    <ol className="flex flex-col gap-[18px]">
                        {text.register.steps.map((step, index) => (
                            <li key={step.title} className="flex gap-3.5">
                                <span className="pt-px font-serif text-[15px] text-accent">
                                    {index + 1}
                                </span>
                                <div>
                                    <div className="text-[15px] font-semibold text-ink">
                                        {step.title}
                                    </div>
                                    <div className="text-sm leading-[1.55] text-ink-muted">
                                        {step.body}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            }
        >
            <div className="flex flex-col gap-1.5">
                <h1 className="font-serif text-[28px] sm:text-3xl font-semibold tracking-[-0.01em] text-ink">
                    Create your account
                </h1>
                <p className="text-[15px] text-ink-faint">
                    {/* The panel carries this line on a wide screen; on a phone
                        there is no panel, so the subtitle says it instead. */}
                    <span className="lg:hidden">{text.register.mobileSub} </span>
                    <span className="hidden lg:inline">
                        Already have one?{' '}
                        <Link to="/login" className="font-semibold text-accent underline">
                            Sign in
                        </Link>
                    </span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => {
                        setPassword(event.target.value);
                        clearError();
                    }}
                    below={<StrengthMeter score={strength.score} />}
                    // The server rejects a password that breaks its rules with a
                    // 422. Naming what is missing here means the user reads it
                    // while typing instead of after a failed submit.
                    helper={
                        password
                            ? strength.satisfied
                                ? `${strength.label} — meets every requirement`
                                : `${strength.label} — needs ${strength.missing.join(', ')}`
                            : 'At least 8 characters, with an uppercase letter, a digit and a special character.'
                    }
                    tone={password && strength.satisfied ? 'success' : 'muted'}
                />

                <FormError>{error}</FormError>

                <Button
                    type="submit"
                    size="lg"
                    id="register-submit-btn"
                    disabled={isSubmitting || !email || !strength.satisfied}
                >
                    {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>

                <p className="text-center text-xs leading-[1.6] text-ink-faint">
                    {text.register.note}
                </p>

                <p className="text-center text-sm text-ink-faint lg:hidden">
                    Already have one?{' '}
                    <Link to="/login" className="font-semibold text-accent underline">
                        Sign in
                    </Link>
                </p>
            </form>
        </AuthShell>
    );
}
