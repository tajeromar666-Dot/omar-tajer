import Icon from "./Icons";

// Compact inline status line rendered directly below an upload button/zone:
// spinner + file name/size while processing, red error or green success
// once it settles. Shared across every image upload area in the dashboard.
export default function UploadStatus({ status, error, success, fileName, fileSize }) {
  if (status === "loading") {
    return (
      <div className="upload-status upload-status--info">
        <span className="upload-spinner" />
        {fileName ? `${fileName}${fileSize ? ` (${fileSize})` : ""}...` : "Chargement..."}
      </div>
    );
  }
  if (status === "error" && error) {
    return (
      <div className="upload-status upload-status--error">
        <Icon name="alertCircle" size={13} /> {error}
      </div>
    );
  }
  if (status === "success" && success) {
    return (
      <div className="upload-status upload-status--success">
        <Icon name="check" size={13} /> {success}
      </div>
    );
  }
  return null;
}
