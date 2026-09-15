// Renders whichever video source is set — an external embed link
// (YouTube/Vimeo) takes priority over an uploaded base64 file.
export default function MediaVideo({ video, videoUrl, title = "", className = "" }) {
  if (videoUrl) {
    return (
      <div className={`media-embed ${className}`}>
        <iframe
          src={videoUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (video) {
    return <video src={video} controls className={className} />;
  }
  return null;
}
