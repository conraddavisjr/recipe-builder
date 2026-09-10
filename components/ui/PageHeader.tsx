/**
 * Page heading in the house style: a small tracked eyebrow, a two-line serif
 * title whose second line is an olive italic phrase, and a quiet lead.
 */
export function PageHeader({
  eyebrow,
  title,
  titleEm,
  description,
  actions,
  size = "xl",
}: {
  eyebrow?: string;
  title: string;
  /** Second line of the title, rendered italic in the accent color. */
  titleEm?: string;
  description?: string;
  actions?: React.ReactNode;
  size?: "xl" | "lg";
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className={`display mt-3 ${size === "xl" ? "display-xl" : "display-lg"}`}>
          {title}
          {titleEm && (
            <>
              <br />
              <em>{titleEm}</em>
            </>
          )}
        </h1>
        {description && <p className="lead mt-5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 pb-2">{actions}</div>}
    </div>
  );
}
