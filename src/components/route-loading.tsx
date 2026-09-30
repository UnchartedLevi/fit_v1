export function RouteLoading({ kind = "page" }: { kind?: "page" | "product" | "checkout" | "admin" }) {
  if (kind === "product") {
    return (
      <div className="page-shell route-loading" aria-busy="true" aria-label="Loading product">
        <div className="route-progress" />
        <div className="route-product-skeleton">
          <div className="route-skeleton route-skeleton--visual" />
          <div className="route-skeleton-stack">
            <div className="route-skeleton route-skeleton--eyebrow" />
            <div className="route-skeleton route-skeleton--title" />
            <div className="route-skeleton route-skeleton--price" />
            <div className="route-skeleton route-skeleton--copy" />
            <div className="route-skeleton route-skeleton--copy short" />
            <div className="route-skeleton route-skeleton--button" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-shell route-loading route-loading--${kind}`} aria-busy="true" aria-label="Loading page">
      <div className="route-progress" />
      <div className="route-skeleton route-skeleton--eyebrow" />
      <div className="route-skeleton route-skeleton--title" />
      <div className="route-skeleton-grid">
        {Array.from({ length: kind === "admin" ? 6 : 4 }, (_, index) => (
          <div className="route-skeleton route-skeleton--panel" key={index} />
        ))}
      </div>
    </div>
  );
}

