"use client"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme()

  return (
    <>
      <style>{`
        /* ── Base toast shell ── */
        .toaster-luxury [data-sonner-toast] {
          background: linear-gradient(
            135deg,
            rgba(10, 10, 20, 0.92) 0%,
            rgba(18, 18, 36, 0.96) 100%
          ) !important;
          backdrop-filter: blur(24px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 16px !important;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.04),
            0 8px 32px rgba(0, 0, 0, 0.5),
            0 2px 8px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
          padding: 14px 16px !important;
          gap: 12px !important;
          min-width: 340px !important;
          max-width: 400px !important;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
          position: relative !important;
          overflow: hidden !important;
        }

        /* Iridescent top shimmer line */
        .toaster-luxury [data-sonner-toast]::before {
          content: "";
          position: absolute;
          top: 0;
          left: 12px;
          right: 12px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(139, 92, 246, 0.6),
            rgba(99, 179, 237, 0.6),
            rgba(167, 243, 208, 0.4),
            transparent
          );
          border-radius: 100%;
        }

        /* Subtle radial glow in corner */
        .toaster-luxury [data-sonner-toast]::after {
          content: "";
          position: absolute;
          top: -40px;
          right: -40px;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .toaster-luxury [data-sonner-toast]:hover {
          transform: translateY(-1px) scale(1.005) !important;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.06),
            0 12px 40px rgba(0, 0, 0, 0.6),
            0 4px 12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
        }

        /* ── Typography ── */
        .toaster-luxury [data-title] {
          font-family: "DM Sans", "SF Pro Display", sans-serif !important;
          font-size: 13.5px !important;
          font-weight: 600 !important;
          letter-spacing: -0.01em !important;
          color: rgba(255, 255, 255, 0.95) !important;
          line-height: 1.3 !important;
        }

        .toaster-luxury [data-description] {
          font-family: "DM Sans", "SF Pro Text", sans-serif !important;
          font-size: 12px !important;
          font-weight: 400 !important;
          color: rgba(255, 255, 255, 0.45) !important;
          letter-spacing: 0.01em !important;
          line-height: 1.5 !important;
          margin-top: 2px !important;
        }

        /* ── Icon wrappers — colored halo rings ── */
        .toaster-luxury [data-sonner-toast] [data-icon] {
          width: 32px !important;
          height: 32px !important;
          border-radius: 10px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
          position: relative !important;
        }

        /* success */
        .toaster-luxury [data-sonner-toast][data-type="success"] [data-icon] {
          background: rgba(16, 185, 129, 0.12) !important;
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2), 0 0 12px rgba(16, 185, 129, 0.08) !important;
        }
        .toaster-luxury [data-sonner-toast][data-type="success"] {
          border-color: rgba(16, 185, 129, 0.15) !important;
        }
        .toaster-luxury [data-sonner-toast][data-type="success"]::before {
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), rgba(52, 211, 153, 0.3), transparent) !important;
        }

        /* error */
        .toaster-luxury [data-sonner-toast][data-type="error"] [data-icon] {
          background: rgba(239, 68, 68, 0.12) !important;
          box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.2), 0 0 12px rgba(239, 68, 68, 0.08) !important;
        }
        .toaster-luxury [data-sonner-toast][data-type="error"] {
          border-color: rgba(239, 68, 68, 0.15) !important;
        }
        .toaster-luxury [data-sonner-toast][data-type="error"]::before {
          background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.5), rgba(252, 165, 165, 0.3), transparent) !important;
        }

        /* warning */
        .toaster-luxury [data-sonner-toast][data-type="warning"] [data-icon] {
          background: rgba(245, 158, 11, 0.12) !important;
          box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2), 0 0 12px rgba(245, 158, 11, 0.08) !important;
        }
        .toaster-luxury [data-sonner-toast][data-type="warning"] {
          border-color: rgba(245, 158, 11, 0.15) !important;
        }
        .toaster-luxury [data-sonner-toast][data-type="warning"]::before {
          background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), rgba(253, 211, 77, 0.3), transparent) !important;
        }

        /* info */
        .toaster-luxury [data-sonner-toast][data-type="info"] [data-icon] {
          background: rgba(99, 179, 237, 0.12) !important;
          box-shadow: 0 0 0 1px rgba(99, 179, 237, 0.2), 0 0 12px rgba(99, 179, 237, 0.08) !important;
        }
        .toaster-luxury [data-sonner-toast][data-type="info"] {
          border-color: rgba(99, 179, 237, 0.15) !important;
        }
        .toaster-luxury [data-sonner-toast][data-type="info"]::before {
          background: linear-gradient(90deg, transparent, rgba(99, 179, 237, 0.5), rgba(147, 210, 247, 0.3), transparent) !important;
        }

        /* ── Close button ── */
        .toaster-luxury [data-close-button] {
          background: rgba(255, 255, 255, 0.06) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 8px !important;
          color: rgba(255, 255, 255, 0.35) !important;
          width: 22px !important;
          height: 22px !important;
          transition: all 0.2s ease !important;
        }
        .toaster-luxury [data-close-button]:hover {
          background: rgba(255, 255, 255, 0.12) !important;
          color: rgba(255, 255, 255, 0.7) !important;
        }

        /* ── Action / Cancel buttons ── */
        .toaster-luxury [data-button] {
          font-family: "DM Sans", sans-serif !important;
          font-size: 11.5px !important;
          font-weight: 500 !important;
          letter-spacing: 0.02em !important;
          padding: 5px 12px !important;
          border-radius: 8px !important;
          transition: all 0.2s ease !important;
        }

        .toaster-luxury [data-action-button] {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(99, 102, 241, 0.9)) !important;
          color: rgba(255, 255, 255, 0.95) !important;
          border: 1px solid rgba(139, 92, 246, 0.3) !important;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.25) !important;
        }
        .toaster-luxury [data-action-button]:hover {
          background: linear-gradient(135deg, rgba(167, 139, 250, 0.95), rgba(129, 140, 248, 0.95)) !important;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4) !important;
        }

        .toaster-luxury [data-cancel-button] {
          background: rgba(255, 255, 255, 0.06) !important;
          color: rgba(255, 255, 255, 0.45) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .toaster-luxury [data-cancel-button]:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.65) !important;
        }

        /* ── Progress bar ── */
        .toaster-luxury [data-sonner-toast] [data-progress-bar] {
          background: linear-gradient(
            90deg,
            rgba(139, 92, 246, 0.7),
            rgba(99, 179, 237, 0.5)
          ) !important;
          height: 2px !important;
          border-radius: 100px !important;
        }

        /* ── Loader spin ── */
        @keyframes luxury-spin {
          to { transform: rotate(360deg); }
        }
        .toaster-luxury .luxury-loader {
          animation: luxury-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }
      `}</style>

      <Sonner
        theme={theme}
        className="toaster-luxury"
        toastOptions={{
          classNames: {
            toast: "",
            title: "",
            description: "",
            actionButton: "",
            cancelButton: "",
          },
        }}
        icons={{
          success: (
            <CircleCheckIcon
              size={16}
              strokeWidth={2.5}
              style={{ color: "rgb(52, 211, 153)" }}
            />
          ),
          info: (
            <InfoIcon
              size={16}
              strokeWidth={2.5}
              style={{ color: "rgb(99, 179, 237)" }}
            />
          ),
          warning: (
            <TriangleAlertIcon
              size={16}
              strokeWidth={2.5}
              style={{ color: "rgb(251, 191, 36)" }}
            />
          ),
          error: (
            <OctagonXIcon
              size={16}
              strokeWidth={2.5}
              style={{ color: "rgb(252, 165, 165)" }}
            />
          ),
          loading: (
            <Loader2Icon
              size={16}
              strokeWidth={2.5}
              className="luxury-loader"
              style={{ color: "rgb(167, 139, 250)" }}
            />
          ),
        }}
        position="top-right"
        richColors={false}
        expand={false}
        duration={4000}
        visibleToasts={3}
        closeButton
        {...props}
      />
    </>
  )
}

export { Toaster }