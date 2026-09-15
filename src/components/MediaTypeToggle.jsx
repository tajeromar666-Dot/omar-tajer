import Icon from "./Icons";

// Small "Image / Vidéo" segmented switch reused across the About, Plans 3D
// and Projects admin forms.
export default function MediaTypeToggle({ value, onChange }) {
  return (
    <div className="media-toggle">
      <button
        type="button"
        className={`media-toggle__btn ${value === "image" ? "active" : ""}`}
        onClick={() => onChange("image")}
      >
        <Icon name="image" size={16} /> Image
      </button>
      <button
        type="button"
        className={`media-toggle__btn ${value === "video" ? "active" : ""}`}
        onClick={() => onChange("video")}
      >
        <Icon name="video" size={16} /> Vidéo
      </button>
    </div>
  );
}
