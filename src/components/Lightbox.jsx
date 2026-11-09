import { useCallback, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import Icon from "./Icons";

// Full-screen media viewer shared by Réalisations and Plans 3D.
// items: [{ type: "image" | "video" | "embed", src }]. Images are shown
// whole (object-fit: contain), never cropped. Keyboard: Esc closes, arrow
// keys navigate (mirrored in RTL); touch: horizontal swipe. Focus moves to
// the close button on open and back to the opener on close; page scroll is
// locked while open.
export default function Lightbox({ items, index, onIndex, onClose, label, children }) {
  const { t, language } = useLanguage();
  const closeRef = useRef(null);
  const touchX = useRef(null);
  const count = items.length;
  const rtl = language === "ar";

  const go = useCallback(
    (delta) => {
      if (count < 2) return;
      onIndex((index + delta + count) % count);
    },
    [count, index, onIndex]
  );

  useEffect(() => {
    const opener = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(rtl ? -1 : 1);
      else if (e.key === "ArrowLeft") go(rtl ? 1 : -1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose, rtl]);

  function onTouchStart(e) {
    touchX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 50) return;
    const forward = dx < 0;
    go(forward !== rtl ? 1 : -1);
  }

  const item = items[index];

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={label} onClick={onClose}>
      <div className="lightbox__panel" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="lightbox__close" onClick={onClose} aria-label={t.common.close}>
          <Icon name="close" size={22} />
        </button>

        <div className="lightbox__stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {item?.type === "video" ? (
            <video key={item.src} src={item.src} controls autoPlay playsInline className="lightbox__media" />
          ) : item?.type === "embed" ? (
            <iframe
              key={item.src}
              src={item.src}
              title={label}
              className="lightbox__media lightbox__media--embed"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : item ? (
            <img key={item.src} src={item.src} alt={`${label} ${index + 1}`} className="lightbox__media" decoding="async" />
          ) : null}

          {count > 1 && (
            <>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--prev"
                onClick={() => go(-1)}
                aria-label={t.common.previous}
              >
                <Icon name="chevronLeft" size={26} />
              </button>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--next"
                onClick={() => go(1)}
                aria-label={t.common.next}
              >
                <Icon name="chevronRight" size={26} />
              </button>
              <span className="lightbox__counter" aria-live="polite">
                {index + 1} / {count}
              </span>
            </>
          )}
        </div>

        {children && <div className="lightbox__caption">{children}</div>}
      </div>
    </div>
  );
}
