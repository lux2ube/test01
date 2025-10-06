
export function PageHeader({ title, description }: { title: string; description?: string; }) {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-bold font-headline">{title}</h1>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
