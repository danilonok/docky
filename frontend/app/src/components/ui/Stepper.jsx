import { Fragment } from 'react';
import { cx } from './cx';

/**
 * Named stages joined by rules: done, current, still to come.
 *
 * Generic over the number of steps because what the backend can actually report
 * is coarser than the five stages in the mocks – indexing is one opaque task, so
 * the upload card drives this with three.
 */
export default function Stepper({ steps, current, className }) {
    return (
        <ol className={cx('flex items-center text-xs', className)}>
            {steps.map((step, index) => {
                const done = index < current;
                const active = index === current;

                return (
                    <Fragment key={step}>
                        {index > 0 && (
                            <li
                                aria-hidden="true"
                                className={cx(
                                    'flex-1 h-px mx-2',
                                    done || active ? 'bg-success' : 'bg-line-soft',
                                )}
                            />
                        )}
                        <li
                            aria-current={active ? 'step' : undefined}
                            className={cx(
                                done && 'text-success',
                                active && 'text-accent font-semibold',
                                !done && !active && 'text-ink-faint',
                            )}
                        >
                            {step}
                        </li>
                    </Fragment>
                );
            })}
        </ol>
    );
}
