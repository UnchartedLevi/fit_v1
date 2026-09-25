import React from "react";

export function ProductsLoadingSkeleton() {
  const skeletonCards = Array.from({ length: 8 });

  return (
    <div className="products-loading-wrapper" aria-busy="true" aria-label="Loading products">
      {/* Search and Filters Skeleton */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            maxWidth: "600px",
            height: "44px",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #161616 0%, #222 50%, #161616 100%)",
            backgroundSize: "200% 100%",
            animation: "fits-shimmer 1.8s infinite linear",
            marginBottom: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />

        <div className="filters" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[140, 110, 120].map((width, i) => (
            <div
              key={i}
              style={{
                width: `${width}px`,
                height: "38px",
                borderRadius: "999px",
                background: "linear-gradient(90deg, #161616 0%, #222 50%, #161616 100%)",
                backgroundSize: "200% 100%",
                animation: "fits-shimmer 1.8s infinite linear",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Loading Status Indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "18px",
          color: "rgba(255,255,255,0.6)",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#cb6ce7",
            boxShadow: "0 0 10px #cb6ce7",
            display: "inline-block",
            animation: "fits-pulse 1.4s ease-in-out infinite",
          }}
        />
        <span>Fetching collection…</span>
      </div>

      {/* Skeleton Product Grid */}
      <div className="product-grid">
        {skeletonCards.map((_, index) => (
          <div
            key={index}
            className="product-card"
            style={{
              opacity: 0.95,
              animation: `fits-fade-in 0.3s ease forwards ${index * 0.05}s`,
            }}
          >
            {/* Visual Box */}
            <div
              style={{
                aspectRatio: "4 / 4.65",
                borderRadius: "4px",
                background: "linear-gradient(90deg, #181818 0%, #252525 50%, #181818 100%)",
                backgroundSize: "200% 100%",
                animation: "fits-shimmer 1.8s infinite linear",
                border: "1px solid rgba(255,255,255,0.06)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.08,
                  fontSize: "36px",
                  fontWeight: 900,
                  letterSpacing: "-0.05em",
                }}
              >
                FITS
              </div>
            </div>

            {/* Meta */}
            <div
              className="product-meta"
              style={{
                padding: "12px 1px",
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: "14px",
                    width: index % 2 === 0 ? "82%" : "68%",
                    borderRadius: "4px",
                    background: "linear-gradient(90deg, #1c1c1c 0%, #2a2a2a 50%, #1c1c1c 100%)",
                    backgroundSize: "200% 100%",
                    animation: "fits-shimmer 1.8s infinite linear",
                    marginBottom: "7px",
                  }}
                />
                <div
                  style={{
                    height: "10px",
                    width: "45%",
                    borderRadius: "3px",
                    background: "linear-gradient(90deg, #181818 0%, #242424 50%, #181818 100%)",
                    backgroundSize: "200% 100%",
                    animation: "fits-shimmer 1.8s infinite linear",
                  }}
                />
              </div>
              <div
                style={{
                  height: "16px",
                  width: "55px",
                  borderRadius: "4px",
                  background: "linear-gradient(90deg, #1c1c1c 0%, #2a2a2a 50%, #1c1c1c 100%)",
                  backgroundSize: "200% 100%",
                  animation: "fits-shimmer 1.8s infinite linear",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
