import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Eyebrow } from '../ui';
import SourcesCard from './SourcesCard';

function formatTime(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? null
        : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function QuestionBlock({ message }) {
    const time = formatTime(message.created_at);

    return (
        <div className="flex flex-col gap-1.5 border-l-[3px] border-accent pl-3.5 sm:pl-[18px]">
            <Eyebrow tone="accent">You asked{time ? ` · ${time}` : ''}</Eyebrow>
            <p className="font-serif text-[19px] leading-[1.35] text-ink sm:text-[22px]">
                {message.content}
            </p>
        </div>
    );
}

function AnswerBlock({ message, onCopy, onRegenerate }) {
    // The worker creates the assistant row empty and fills it in when the model
    // is done, so an unfinished message is not an error — it is the answer, not
    // written yet.
    if (!message.finished) {
        return (
            <p className="font-serif text-[16px] italic text-ink-faint sm:text-[17px]">
                Reading the attached documents…
            </p>
        );
    }

    if (!message.content) {
        return (
            <p className="text-[13px] text-danger">
                This answer came back empty. Ask again, or check that the worker is running.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-3.5">
            <div className="prose-answer">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {message.content}
                </ReactMarkdown>
            </div>

            <SourcesCard sources={message.source_nodes} />

            {/* The mocks also offer Helpful / Not helpful. There is no endpoint
                to record either, so they are left out rather than shipped as
                buttons that quietly do nothing. */}
            <div className="flex gap-4 text-xs text-ink-faint">
                <button type="button" onClick={() => onCopy(message)} className="cursor-pointer hover:text-ink-muted">
                    Copy
                </button>
                <button
                    type="button"
                    onClick={() => onRegenerate(message)}
                    className="cursor-pointer hover:text-ink-muted"
                >
                    Regenerate
                </button>
            </div>
        </div>
    );
}

export default function Transcript({ messages, emptyState, onCopy, onRegenerate }) {
    const scrollRef = useRef(null);
    const endRef = useRef(null);
    const countRef = useRef(0);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container || messages.length === countRef.current) return;

        const previous = countRef.current;
        countRef.current = messages.length;
        if (messages.length < previous) return;

        // Only follow the conversation if the reader is already at the bottom.
        // Yanking the view down while someone is reading an earlier answer is
        // worse than letting a new one arrive off-screen.
        const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceFromBottom < 160) {
            endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages]);

    return (
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto px-4 py-5 sm:px-10 sm:py-8">
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 sm:gap-[30px]">
                {messages.length === 0 ? emptyState : null}

                {messages.map((message) =>
                    message.agentic ? (
                        <AnswerBlock
                            key={message.id}
                            message={message}
                            onCopy={onCopy}
                            onRegenerate={onRegenerate}
                        />
                    ) : (
                        <QuestionBlock key={message.id} message={message} />
                    ),
                )}

                <div ref={endRef} />
            </div>
        </div>
    );
}
