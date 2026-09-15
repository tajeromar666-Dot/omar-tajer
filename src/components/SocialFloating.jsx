import { loadSocial } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import Icon from "./Icons";

export function whatsappHref(number) {
  let digits = number.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "212" + digits.slice(1);
  return `https://wa.me/${digits}`;
}

const LINKS = [
  { key: "facebook", icon: "facebook", getHref: (s) => s.facebook.url },
  { key: "linkedin", icon: "linkedin", getHref: (s) => s.linkedin.url },
  { key: "instagram", icon: "instagram", getHref: (s) => s.instagram.url },
  { key: "whatsapp", icon: "whatsapp", getHref: (s) => whatsappHref(s.whatsapp.number) },
];

export default function SocialFloating() {
  const [social] = useLiveStorage(loadSocial);

  const active = LINKS.filter((l) => {
    const entry = social[l.key];
    const hasValue = l.key === "whatsapp" ? entry.number.trim() : entry.url.trim();
    return entry.enabled && hasValue;
  });

  if (active.length === 0) return null;

  return (
    <div className="social-floating">
      {active.map((l) => (
        <a
          key={l.key}
          href={l.getHref(social)}
          target="_blank"
          rel="noreferrer noopener"
          className={`social-floating__btn social-floating__btn--${l.key}`}
          aria-label={l.key}
        >
          <Icon name={l.icon} size={20} />
        </a>
      ))}
    </div>
  );
}
