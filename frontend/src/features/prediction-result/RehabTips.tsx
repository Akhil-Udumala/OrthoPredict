interface RehabTipsProps {
  tips: string[];
}

export function RehabTips({ tips }: RehabTipsProps) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Rehab tips</h3>
        <p className="text-xs leading-5 text-muted-foreground">
          These practical suggestions are returned directly by the backend.
        </p>
      </div>
      <ol className="space-y-3 text-sm leading-6 text-foreground">
        {tips.map((tip, index) => (
          <li key={tip} className="flex gap-3 rounded-2xl bg-secondary/45 px-4 py-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <span>{tip}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

