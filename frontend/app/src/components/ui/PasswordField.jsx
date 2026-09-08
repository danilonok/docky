import { useState } from 'react';
import TextField from './TextField';

/** A password input with a Show/Hide toggle, matching the field styling. */
export default function PasswordField({ label = 'Password', ...props }) {
    const [visible, setVisible] = useState(false);

    return (
        <TextField
            label={label}
            type={visible ? 'text' : 'password'}
            trailing={
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    className="-mr-2 flex h-11 min-w-11 cursor-pointer items-center justify-center px-2 text-[13px] text-ink-faint hover:text-ink-muted sm:h-auto sm:min-w-0 sm:px-0"
                    // The label says what the click does; the state is conveyed by
                    // the input type, which assistive tech already announces.
                    aria-label={visible ? 'Hide password' : 'Show password'}
                >
                    {visible ? 'Hide' : 'Show'}
                </button>
            }
            {...props}
        />
    );
}
