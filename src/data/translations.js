// Multi-language support — static UI text only (navbar, section tags/titles/
// subtitles, buttons, form labels, footer boilerplate). Admin-editable
// content (hero slide text, about description, service/project/testimonial
// entries, team member names...) is authored once by the admin and is not
// machine-translated; it always displays as entered.

export const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

export const RTL_LANGUAGES = ["ar"];

export const DEFAULT_LANGUAGE = "fr";

export const TRANSLATIONS = {
  fr: {
    nav: {
      home: "Accueil",
      about: "À Propos",
      services: "Services",
      plans3d: "Plans 3D",
      portfolio: "Réalisations",
      partners: "Partenaires",
      testimonials: "Témoignages",
      team: "Équipe",
      whyus: "Pourquoi Nous",
      contact: "Contact",
      contactBtn: "Nous Contacter",
      openMenu: "Ouvrir le menu",
      closeMenu: "Fermer le menu",
    },
    hero: {
      eyebrow: "Génie Civil · Charpente · Chaudronnerie",
      ctaServices: "Nos Services",
      ctaPortfolio: "Nos Réalisations",
      scrollText: "Découvrir",
      statExperience: "Années d'expérience",
      statProjects: "Projets réalisés",
      statSatisfaction: "Clients satisfaits",
      statCollaborators: "Collaborateurs",
    },
    about: {
      tag: "À Propos de CIA",
    },
    services: {
      tag: "Nos Métiers",
      titleA: "Des",
      titleAccent: "Services Industriels",
      titleB: "Complets",
      subtitle:
        "De la structure au traitement de surface, CIA maîtrise l'ensemble des corps de métier nécessaires à vos projets industriels.",
    },
    plans3d: {
      tag: "Bureau d'Études",
      titleA: "Plans 3D &",
      titleAccent: "Études Techniques",
      titleB: "",
      subtitle:
        "Nos études de conception, modélisations 3D et plans d'exécution réalisés pour préparer vos chantiers avec précision.",
      filterAll: "Tous",
      emptyState: "Aucun élément pour ce type.",
    },
    portfolio: {
      tag: "Nos Réalisations",
      titleA: "Des",
      titleAccent: "Projets",
      titleB: "à Notre Image",
      subtitle:
        "Un aperçu de nos chantiers réalisés pour des industriels et enseignes de premier plan au Maroc.",
      filterAll: "Tous",
      emptyState: "Aucune réalisation pour cette catégorie.",
      viewProject: "Voir le projet",
    },
    partners: {
      tag: "Ils Nous Font Confiance",
      titleA: "Nos",
      titleAccent: "Partenaires",
      titleB: "",
      subtitle:
        "CIA accompagne des groupes industriels et enseignes de référence dans leurs projets de construction et de maintenance.",
    },
    whyus: {
      tag: "Pourquoi Nous Choisir",
      titleA: "L'excellence",
      titleAccent: "industrielle",
      titleB: "en pratique",
      subtitle:
        "Ce qui distingue CIA sur chaque chantier, du premier coup de pelle à la réception des travaux.",
    },
    team: {
      tag: "L'équipe CIA",
      titleA: "Notre",
      titleAccent: "Équipe",
      titleB: "",
      subtitle:
        "Des professionnels expérimentés, engagés sur chaque chantier du premier plan d'exécution à la réception des travaux.",
      collaboratorsLabel: "Collaborateurs",
      collaboratorsSubtext: "Ouvriers & Techniciens qualifiés",
    },
    testimonials: {
      tag: "Témoignages",
      titleA: "Ce que disent",
      titleAccent: "nos clients",
      titleB: "",
      subtitle: "La confiance de nos partenaires industriels, chantier après chantier.",
    },
    contact: {
      tag: "Contactez-nous",
      titleA: "Parlons de",
      titleAccent: "Votre Projet",
      titleB: "",
      subtitle:
        "Une équipe, un interlocuteur, une solution industrielle sur mesure — contactez CIA dès aujourd'hui.",
      addressLabel: "Adresse",
      phoneLabel: "Téléphone",
      emailLabel: "Email",
      locationsTitle: "Nos Localisations",
      formNameLabel: "Nom complet",
      formNamePlaceholder: "Votre nom",
      formPhoneLabel: "Téléphone",
      formPhonePlaceholder: "06 XX XX XX XX",
      formEmailLabel: "Email",
      formEmailPlaceholder: "vous@exemple.com",
      formMessageLabel: "Message",
      formMessagePlaceholder: "Décrivez votre projet...",
      submitBtn: "Envoyer le message",
      successMessage:
        "Votre message a bien été envoyé. Notre équipe vous répondra dans les plus brefs délais.",
      errorNameRequired: "Le nom est requis.",
      errorEmailRequired: "L'email est requis.",
      errorEmailInvalid: "Email invalide.",
      errorPhoneRequired: "Le téléphone est requis.",
      errorMessageRequired: "Le message est requis.",
    },
    footer: {
      about:
        "Construction Industrielle Africaine — génie civil, charpente métallique, chaudronnerie, tuyauterie, sablage et peinture four. Basée à Mediouna, au service de l'industrie marocaine et africaine.",
      quickLinks: "Liens Rapides",
      servicesTitle: "Nos Services",
      contactTitle: "Contact",
      copyright: "Tous droits réservés.",
      adminLink: "Espace Administration",
    },
    whatsapp: {
      tooltip: "Contactez-nous sur WhatsApp",
    },
  },

  en: {
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      plans3d: "3D Plans",
      portfolio: "Projects",
      partners: "Partners",
      testimonials: "Testimonials",
      team: "Team",
      whyus: "Why Us",
      contact: "Contact",
      contactBtn: "Contact Us",
      openMenu: "Open menu",
      closeMenu: "Close menu",
    },
    hero: {
      eyebrow: "Civil Engineering · Steel Framing · Boilermaking",
      ctaServices: "Our Services",
      ctaPortfolio: "Our Projects",
      scrollText: "Discover",
      statExperience: "Years of experience",
      statProjects: "Completed projects",
      statSatisfaction: "Satisfied clients",
      statCollaborators: "Team members",
    },
    about: {
      tag: "About CIA",
    },
    services: {
      tag: "Our Trades",
      titleA: "Complete",
      titleAccent: "Industrial Services",
      titleB: "",
      subtitle:
        "From structural work to surface treatment, CIA masters every trade your industrial projects require.",
    },
    plans3d: {
      tag: "Design Office",
      titleA: "3D Plans &",
      titleAccent: "Technical Studies",
      titleB: "",
      subtitle:
        "Our design studies, 3D models and execution plans prepared to get your sites ready with precision.",
      filterAll: "All",
      emptyState: "No items for this type.",
    },
    portfolio: {
      tag: "Our Projects",
      titleA: "Projects",
      titleAccent: "That Speak",
      titleB: "For Us",
      subtitle:
        "A look at our completed sites for leading industrial groups and retailers across Morocco.",
      filterAll: "All",
      emptyState: "No projects in this category.",
      viewProject: "View project",
    },
    partners: {
      tag: "They Trust Us",
      titleA: "Our",
      titleAccent: "Partners",
      titleB: "",
      subtitle:
        "CIA supports leading industrial groups and retail chains in their construction and maintenance projects.",
    },
    whyus: {
      tag: "Why Choose Us",
      titleA: "Industrial",
      titleAccent: "excellence",
      titleB: "in practice",
      subtitle:
        "What sets CIA apart on every site, from the first shovel of earth to project handover.",
    },
    team: {
      tag: "The CIA team",
      titleA: "Our",
      titleAccent: "Team",
      titleB: "",
      subtitle:
        "Experienced professionals, committed to every site from execution planning through to handover.",
      collaboratorsLabel: "Team members",
      collaboratorsSubtext: "Skilled workers & technicians",
    },
    testimonials: {
      tag: "Testimonials",
      titleA: "What",
      titleAccent: "our clients say",
      titleB: "",
      subtitle: "The trust of our industrial partners, site after site.",
    },
    contact: {
      tag: "Contact Us",
      titleA: "Let's Talk About",
      titleAccent: "Your Project",
      titleB: "",
      subtitle:
        "One team, one point of contact, a tailored industrial solution — get in touch with CIA today.",
      addressLabel: "Address",
      phoneLabel: "Phone",
      emailLabel: "Email",
      locationsTitle: "Our Locations",
      formNameLabel: "Full name",
      formNamePlaceholder: "Your name",
      formPhoneLabel: "Phone",
      formPhonePlaceholder: "Phone number",
      formEmailLabel: "Email",
      formEmailPlaceholder: "you@example.com",
      formMessageLabel: "Message",
      formMessagePlaceholder: "Describe your project...",
      submitBtn: "Send Message",
      successMessage:
        "Your message has been sent successfully. Our team will get back to you shortly.",
      errorNameRequired: "Name is required.",
      errorEmailRequired: "Email is required.",
      errorEmailInvalid: "Invalid email.",
      errorPhoneRequired: "Phone is required.",
      errorMessageRequired: "Message is required.",
    },
    footer: {
      about:
        "Construction Industrielle Africaine — civil engineering, steel framing, boilermaking, industrial piping, sandblasting and oven painting. Based in Mediouna, serving Moroccan and African industry.",
      quickLinks: "Quick Links",
      servicesTitle: "Our Services",
      contactTitle: "Contact",
      copyright: "All rights reserved.",
      adminLink: "Admin Area",
    },
    whatsapp: {
      tooltip: "Chat with us on WhatsApp",
    },
  },

  de: {
    nav: {
      home: "Startseite",
      about: "Über uns",
      services: "Leistungen",
      plans3d: "3D-Pläne",
      portfolio: "Projekte",
      partners: "Partner",
      testimonials: "Referenzen",
      team: "Team",
      whyus: "Warum wir",
      contact: "Kontakt",
      contactBtn: "Kontaktieren Sie uns",
      openMenu: "Menü öffnen",
      closeMenu: "Menü schließen",
    },
    hero: {
      eyebrow: "Tiefbau · Stahlbau · Kesselbau",
      ctaServices: "Unsere Leistungen",
      ctaPortfolio: "Unsere Projekte",
      scrollText: "Entdecken",
      statExperience: "Jahre Erfahrung",
      statProjects: "Realisierte Projekte",
      statSatisfaction: "Zufriedene Kunden",
      statCollaborators: "Mitarbeiter",
    },
    about: {
      tag: "Über CIA",
    },
    services: {
      tag: "Unsere Gewerke",
      titleA: "Umfassende",
      titleAccent: "Industriedienstleistungen",
      titleB: "",
      subtitle:
        "Vom Rohbau bis zur Oberflächenbehandlung beherrscht CIA alle für Ihre Industrieprojekte erforderlichen Gewerke.",
    },
    plans3d: {
      tag: "Planungsbüro",
      titleA: "3D-Pläne &",
      titleAccent: "Technische Studien",
      titleB: "",
      subtitle:
        "Unsere Entwurfsstudien, 3D-Modelle und Ausführungspläne für eine präzise Baustellenvorbereitung.",
      filterAll: "Alle",
      emptyState: "Keine Einträge für diesen Typ.",
    },
    portfolio: {
      tag: "Unsere Projekte",
      titleA: "Projekte,",
      titleAccent: "die für sich sprechen",
      titleB: "",
      subtitle:
        "Ein Einblick in unsere realisierten Baustellen für führende Industriegruppen und Handelsketten in Marokko.",
      filterAll: "Alle",
      emptyState: "Keine Projekte in dieser Kategorie.",
      viewProject: "Projekt ansehen",
    },
    partners: {
      tag: "Sie vertrauen uns",
      titleA: "Unsere",
      titleAccent: "Partner",
      titleB: "",
      subtitle:
        "CIA begleitet führende Industriegruppen und renommierte Handelsketten bei ihren Bau- und Wartungsprojekten.",
    },
    whyus: {
      tag: "Warum uns wählen",
      titleA: "Industrielle",
      titleAccent: "Exzellenz",
      titleB: "in der Praxis",
      subtitle:
        "Was CIA auf jeder Baustelle auszeichnet, vom ersten Spatenstich bis zur Abnahme.",
    },
    team: {
      tag: "Das CIA-Team",
      titleA: "Unser",
      titleAccent: "Team",
      titleB: "",
      subtitle:
        "Erfahrene Fachkräfte, die sich auf jeder Baustelle von der Ausführungsplanung bis zur Abnahme engagieren.",
      collaboratorsLabel: "Mitarbeiter",
      collaboratorsSubtext: "Qualifizierte Arbeiter & Techniker",
    },
    testimonials: {
      tag: "Referenzen",
      titleA: "Was",
      titleAccent: "unsere Kunden sagen",
      titleB: "",
      subtitle: "Das Vertrauen unserer Industriepartner, Baustelle für Baustelle.",
    },
    contact: {
      tag: "Kontaktieren Sie uns",
      titleA: "Sprechen wir über",
      titleAccent: "Ihr Projekt",
      titleB: "",
      subtitle:
        "Ein Team, ein Ansprechpartner, eine maßgeschneiderte Industrielösung — kontaktieren Sie CIA noch heute.",
      addressLabel: "Adresse",
      phoneLabel: "Telefon",
      emailLabel: "E-Mail",
      locationsTitle: "Unsere Standorte",
      formNameLabel: "Vollständiger Name",
      formNamePlaceholder: "Ihr Name",
      formPhoneLabel: "Telefon",
      formPhonePlaceholder: "Telefonnummer",
      formEmailLabel: "E-Mail",
      formEmailPlaceholder: "sie@beispiel.com",
      formMessageLabel: "Nachricht",
      formMessagePlaceholder: "Beschreiben Sie Ihr Projekt...",
      submitBtn: "Nachricht senden",
      successMessage:
        "Ihre Nachricht wurde erfolgreich gesendet. Unser Team meldet sich in Kürze bei Ihnen.",
      errorNameRequired: "Der Name ist erforderlich.",
      errorEmailRequired: "Die E-Mail ist erforderlich.",
      errorEmailInvalid: "Ungültige E-Mail.",
      errorPhoneRequired: "Das Telefon ist erforderlich.",
      errorMessageRequired: "Die Nachricht ist erforderlich.",
    },
    footer: {
      about:
        "Construction Industrielle Africaine — Tiefbau, Stahlbau, Kesselbau, Industrierohrleitungen, Sandstrahlen und Ofenlackierung. Mit Sitz in Mediouna, im Dienst der marokkanischen und afrikanischen Industrie.",
      quickLinks: "Schnellzugriff",
      servicesTitle: "Unsere Leistungen",
      contactTitle: "Kontakt",
      copyright: "Alle Rechte vorbehalten.",
      adminLink: "Verwaltungsbereich",
    },
    whatsapp: {
      tooltip: "Kontaktieren Sie uns über WhatsApp",
    },
  },

  ar: {
    nav: {
      home: "الرئيسية",
      about: "من نحن",
      services: "خدماتنا",
      plans3d: "مخططات ثلاثية الأبعاد",
      portfolio: "إنجازاتنا",
      partners: "شركاؤنا",
      testimonials: "آراء العملاء",
      team: "فريقنا",
      whyus: "لماذا نحن",
      contact: "اتصل بنا",
      contactBtn: "تواصل معنا",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
    },
    hero: {
      eyebrow: "الأشغال المدنية · الهياكل المعدنية · صناعة الغلايات",
      ctaServices: "خدماتنا",
      ctaPortfolio: "إنجازاتنا",
      scrollText: "اكتشف المزيد",
      statExperience: "سنوات من الخبرة",
      statProjects: "مشروع منجز",
      statSatisfaction: "عملاء راضون",
      statCollaborators: "متعاون",
    },
    about: {
      tag: "من نحن",
    },
    services: {
      tag: "مجالات عملنا",
      titleA: "خدمات صناعية",
      titleAccent: "متكاملة",
      titleB: "لمشاريعكم",
      subtitle:
        "من الهيكل إلى معالجة الأسطح، تتقن CIA جميع الحرف اللازمة لمشاريعكم الصناعية.",
    },
    plans3d: {
      tag: "مكتب الدراسات",
      titleA: "مخططات ثلاثية الأبعاد",
      titleAccent: "ودراسات تقنية",
      titleB: "",
      subtitle:
        "دراسات التصميم والنماذج ثلاثية الأبعاد ومخططات التنفيذ المُعدة لتحضير مواقعكم بدقة.",
      filterAll: "الكل",
      emptyState: "لا توجد عناصر لهذا النوع.",
    },
    portfolio: {
      tag: "إنجازاتنا",
      titleA: "مشاريع",
      titleAccent: "تعكس صورتنا",
      titleB: "",
      subtitle:
        "نظرة على مواقعنا المنجزة لمجموعات صناعية وعلامات تجارية رائدة في المغرب.",
      filterAll: "الكل",
      emptyState: "لا توجد إنجازات لهذه الفئة.",
      viewProject: "عرض المشروع",
    },
    partners: {
      tag: "يثقون بنا",
      titleA: "شركاؤنا",
      titleAccent: "",
      titleB: "",
      subtitle:
        "ترافق CIA مجموعات صناعية وعلامات تجارية مرجعية في مشاريع البناء والصيانة الخاصة بها.",
    },
    whyus: {
      tag: "لماذا تختارنا",
      titleA: "التميز",
      titleAccent: "الصناعي",
      titleB: "في الممارسة",
      subtitle: "ما يميز CIA في كل موقع، من أول ضربة معول إلى تسليم الأشغال.",
    },
    team: {
      tag: "فريق CIA",
      titleA: "فريقنا",
      titleAccent: "",
      titleB: "",
      subtitle:
        "محترفون ذوو خبرة، ملتزمون في كل موقع من التخطيط التنفيذي إلى التسليم.",
      collaboratorsLabel: "متعاون",
      collaboratorsSubtext: "عمال وتقنيون مؤهلون",
    },
    testimonials: {
      tag: "آراء العملاء",
      titleA: "ماذا يقول",
      titleAccent: "عملاؤنا",
      titleB: "",
      subtitle: "ثقة شركائنا الصناعيين، موقعًا تلو الآخر.",
    },
    contact: {
      tag: "اتصل بنا",
      titleA: "لنتحدث عن",
      titleAccent: "مشروعكم",
      titleB: "",
      subtitle:
        "فريق واحد، محاور واحد، حل صناعي على مقاس احتياجاتكم — تواصلوا مع CIA اليوم.",
      addressLabel: "العنوان",
      phoneLabel: "الهاتف",
      emailLabel: "البريد الإلكتروني",
      locationsTitle: "مواقعنا",
      formNameLabel: "الاسم الكامل",
      formNamePlaceholder: "اسمكم",
      formPhoneLabel: "الهاتف",
      formPhonePlaceholder: "رقم الهاتف",
      formEmailLabel: "البريد الإلكتروني",
      formEmailPlaceholder: "example@email.com",
      formMessageLabel: "الرسالة",
      formMessagePlaceholder: "صف مشروعكم...",
      submitBtn: "إرسال الرسالة",
      successMessage: "تم إرسال رسالتكم بنجاح. سيقوم فريقنا بالرد عليكم في أقرب وقت ممكن.",
      errorNameRequired: "الاسم مطلوب.",
      errorEmailRequired: "البريد الإلكتروني مطلوب.",
      errorEmailInvalid: "بريد إلكتروني غير صالح.",
      errorPhoneRequired: "رقم الهاتف مطلوب.",
      errorMessageRequired: "الرسالة مطلوبة.",
    },
    footer: {
      about:
        "Construction Industrielle Africaine — أشغال مدنية، هياكل معدنية، صناعة غلايات، أنابيب صناعية، السفع الرملي وطلاء الأفران. مقرها في مديونة، في خدمة الصناعة المغربية والإفريقية.",
      quickLinks: "روابط سريعة",
      servicesTitle: "خدماتنا",
      contactTitle: "اتصل بنا",
      copyright: "جميع الحقوق محفوظة.",
      adminLink: "مساحة الإدارة",
    },
    whatsapp: {
      tooltip: "تواصلوا معنا عبر واتساب",
    },
  },
};

export function getTranslation(language) {
  return TRANSLATIONS[language] || TRANSLATIONS[DEFAULT_LANGUAGE];
}
