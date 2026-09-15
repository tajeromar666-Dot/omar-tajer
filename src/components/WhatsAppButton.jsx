import { useLanguage } from "../context/LanguageContext.jsx";
import { loadWhatsApp } from "../data/seedData";
import useLiveStorage from "../hooks/useLiveStorage";
import Icon from "./Icons";
import { whatsappHref } from "./SocialFloating";

export default function WhatsAppButton() {
  const { t } = useLanguage();
  const [whatsapp] = useLiveStorage(loadWhatsApp);

  if (!whatsapp.enabled || !whatsapp.number.trim()) return null;

  return (
    <a
      href={whatsappHref(whatsapp.number)}
      target="_blank"
      rel="noreferrer noopener"
      className="whatsapp-button"
      aria-label={t.whatsapp.tooltip}
    >
      <span className="whatsapp-button__icon">
        <Icon name="whatsapp" size={28} />
      </span>
      <span className="whatsapp-button__tooltip">{t.whatsapp.tooltip}</span>
    </a>
  );
}
