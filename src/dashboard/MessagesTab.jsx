import { useEffect, useState } from "react";
import { loadMessages, saveMessages } from "../data/seedData";
import Icon from "../components/Icons";
import { whatsappHref } from "../components/SocialFloating";

export default function MessagesTab() {
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const [copiedReplyId, setCopiedReplyId] = useState(null);
  const [replyOpenId, setReplyOpenId] = useState(null);
  const [replyForms, setReplyForms] = useState({});

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  function update(updated) {
    setMessages(updated);
    saveMessages(updated);
  }

  function toggleRead(id) {
    update(messages.map((m) => (m.id === id ? { ...m, read: !m.read } : m)));
  }

  function remove(id) {
    if (!window.confirm("Supprimer ce message ?")) return;
    update(messages.filter((m) => m.id !== id));
  }

  function copyPhone(id, phone) {
    navigator.clipboard?.writeText(phone).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 2000);
    });
  }

  function toggleReply(m) {
    setReplyOpenId((cur) => (cur === m.id ? null : m.id));
    setReplyForms((forms) =>
      forms[m.id]
        ? forms
        : {
            ...forms,
            [m.id]: {
              to: m.email,
              subject: "Re: votre message",
              body: `Bonjour ${m.name},\n\n`,
            },
          }
    );
  }

  function updateReplyField(id, field, value) {
    setReplyForms((forms) => ({ ...forms, [id]: { ...forms[id], [field]: value } }));
  }

  function copyReplyMessage(id) {
    const reply = replyForms[id];
    if (!reply) return;
    navigator.clipboard?.writeText(reply.body).then(() => {
      setCopiedReplyId(id);
      setTimeout(() => setCopiedReplyId((cur) => (cur === id ? null : cur)), 2000);
    });
  }

  function mailtoHref(reply) {
    const params = new URLSearchParams({ subject: reply.subject, body: reply.body });
    return `mailto:${reply.to}?${params.toString().replace(/\+/g, "%20")}`;
  }

  const visible = messages.filter((m) => {
    if (filter === "unread") return !m.read;
    if (filter === "read") return m.read;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div>
      <div className="dashboard__topbar">
        <div>
          <h1>Messages</h1>
          <p>
            {messages.length} message(s) reçu(s) — {unreadCount} non lu(s).
          </p>
        </div>
        <div className="portfolio__filters" style={{ margin: 0 }}>
          {[
            { key: "all", label: "Tous" },
            { key: "unread", label: "Non lus" },
            { key: "read", label: "Lus" },
          ].map((f) => (
            <button
              key={f.key}
              className={`filter-btn ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        {visible.length === 0 ? (
          <p style={{ color: "var(--color-gray-500)" }}>Aucun message à afficher.</p>
        ) : (
          visible.map((m) => (
            <div className={`message-item ${m.read ? "" : "unread"}`} key={m.id}>
              <div className="message-item__head">
                <div>
                  <strong>{m.name}</strong>{" "}
                  <span className="message-item__meta">
                    · {new Date(m.date).toLocaleString("fr-FR")}
                  </span>
                </div>
                <span className={`badge ${m.read ? "badge--gray" : "badge--blue"}`}>
                  {m.read ? "Lu" : "Non lu"}
                </span>
              </div>
              <div className="message-item__meta">
                <Icon name="mail" size={13} /> {m.email} &nbsp;·&nbsp;
                <Icon name="phone" size={13} /> <strong>{m.phone}</strong>
              </div>
              <p className="message-item__body">{m.message}</p>
              <div className="row-actions">
                <button
                  className={`btn btn--ghost btn--sm ${replyOpenId === m.id ? "active" : ""}`}
                  onClick={() => toggleReply(m)}
                >
                  <Icon name="mail" size={16} /> Répondre
                </button>
                <a
                  className="btn-icon"
                  href={`mailto:${m.email}`}
                  title="Ouvrir dans le client email"
                >
                  <Icon name="send" size={16} />
                </a>
                {m.phone && (
                  <a
                    className="btn-icon"
                    href={whatsappHref(m.phone)}
                    target="_blank"
                    rel="noreferrer noopener"
                    title="Répondre par WhatsApp"
                  >
                    <Icon name="whatsapp" size={16} />
                  </a>
                )}
                {m.phone && (
                  <span className="copy-phone-wrap">
                    <button
                      className="btn-icon"
                      onClick={() => copyPhone(m.id, m.phone)}
                      title="Copier le numéro"
                    >
                      <Icon name="copy" size={16} />
                    </button>
                    <span className={`copy-phone-tooltip ${copiedId === m.id ? "show" : ""}`}>
                      Copié !
                    </span>
                  </span>
                )}
                <button className="btn-icon" onClick={() => toggleRead(m.id)} title="Marquer">
                  <Icon name={m.read ? "mail" : "checkCircle"} size={16} />
                </button>
                <button
                  className="btn-icon btn-icon--danger"
                  onClick={() => remove(m.id)}
                  title="Supprimer"
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>

              {replyOpenId === m.id && replyForms[m.id] && (
                <div className="reply-form">
                  <div className="form-group">
                    <label>À</label>
                    <input
                      type="email"
                      value={replyForms[m.id].to}
                      onChange={(e) => updateReplyField(m.id, "to", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Objet</label>
                    <input
                      type="text"
                      value={replyForms[m.id].subject}
                      onChange={(e) => updateReplyField(m.id, "subject", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      rows={5}
                      value={replyForms[m.id].body}
                      onChange={(e) => updateReplyField(m.id, "body", e.target.value)}
                    />
                  </div>
                  <div className="reply-form__actions">
                    <a
                      className="btn btn--primary btn--sm"
                      href={mailtoHref(replyForms[m.id])}
                    >
                      <Icon name="send" size={15} /> Envoyer
                    </a>
                    <span className="copy-phone-wrap">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => copyReplyMessage(m.id)}
                      >
                        <Icon name="copy" size={15} /> Copier le message
                      </button>
                      <span className={`copy-phone-tooltip ${copiedReplyId === m.id ? "show" : ""}`}>
                        Copié !
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
