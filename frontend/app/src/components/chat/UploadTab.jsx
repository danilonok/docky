import { useRef, useState } from 'react';
import { cx } from '../ui';
import UploadCard from './UploadCard';
import { ACCEPT_ATTRIBUTE } from '../../lib/uploads';
import { copy } from '../../config/editions';

/** Drop zone plus the cards for everything in flight. */
export default function UploadTab({ uploads, indexing, onFiles, onRetry, onDismiss }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleDrop = (event) => {
        event.preventDefault();
        setDragging(false);
        const files = [...(event.dataTransfer?.files ?? [])];
        if (files.length > 0) onFiles(files);
    };

    return (
        <div className="min-h-0 flex-1 overflow-auto px-4 pt-4 sm:px-6">
            <div className="flex flex-col gap-3">
                {uploads.map((upload) => (
                    <UploadCard
                        key={upload.id}
                        upload={upload}
                        status={upload.documentId ? indexing[upload.documentId] : null}
                        onRetry={onRetry}
                        onDismiss={onDismiss}
                    />
                ))}

                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={cx(
                        'flex w-full cursor-pointer flex-col gap-1 rounded-lg border border-dashed px-5 py-6 text-center transition-colors',
                        dragging ? 'border-accent bg-paper-tint' : 'border-line-strong',
                    )}
                >
                    <span className="text-sm text-ink-muted">
                        {uploads.length > 0 ? 'Drop more files here' : 'Drop a PDF here, or '}
                        {uploads.length === 0 && (
                            <span className="font-semibold text-accent underline">
                                browse your computer
                            </span>
                        )}
                    </span>
                    <span className="text-xs text-ink-faint">{copy().upload.dropzoneHint}</span>
                </button>

                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={ACCEPT_ATTRIBUTE}
                    className="hidden"
                    onChange={(event) => {
                        const files = [...(event.target.files ?? [])];
                        if (files.length > 0) onFiles(files);
                        // Cleared so choosing the same file twice still fires.
                        event.target.value = '';
                    }}
                />

                <p className="pb-4 text-center text-xs leading-[1.5] text-ink-faint">
                    Indexing continues in the background – you can close this and keep working.
                </p>
            </div>
        </div>
    );
}
