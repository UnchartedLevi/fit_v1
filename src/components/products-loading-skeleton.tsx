import React from "react";

export function ProductsLoadingSkeleton() {
  const skeletonCards = Array.from({ length: 8 });

  return (
    <div className="products-loading-wrapper" aria-busy="true" aria-label="Loading products">
      {/* Single-Line Category and Filter Button Skeleton */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          paddingBottom: "16px",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "center", overflow: "hidden" }}>
          {[48, 80, 95, 75, 110, 85].map((width, i) => (
            <div
              key={i}
              style={{
                width: `${width}px`,
                height: "20px",
                borderRadius: "4px",
                background: "linear-gradient(90deg, #e4e3dd 0%, #edece6 50%, #e4e3dd 100%)",
                backgroundSize: "200% 100%",
                animation: "fits-shimmer 1.8s infinite linear",
              }}
            />
          ))}
        </div>

        <div
          style={{
            width: "120px",
            height: "36px",
            borderRadius: "4px",
            flexShrink: 0,
            background: "linear-gradient(90deg, #e4e3dd 0%, #edece6 50%, #e4e3dd 100%)",
            backgroundSize: "200% 100%",
            animation: "fits-shimmer 1.8s infinite linear",
            border: "1px solid rgba(0,0,0,0.12)",
          }}
        />
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
