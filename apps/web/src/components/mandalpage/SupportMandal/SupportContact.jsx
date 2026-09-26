import { useLanguage } from '@/hooks/useLanguage';

/**
 * SupportContact — Help desk or treasurer contact for voluntary contribution assistance
 */
export default function SupportContact({ contact }) {
  const { t, getLocalized } = useLanguage();

  if (!contact || (!contact.phone && !contact.whatsapp)) return null;

  const contactName = contact.name ? getLocalized(contact.name) : null;
  const phone = contact.phone || null;
  const whatsappNumber = contact.whatsapp || phone;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('needHelpWithContribution'))}`
    : null;

  return (
    <div className="support-contact">
      <div className="support-contact__header">
        <h4 className="support-contact__title">
          {t('needHelpWithContribution')}
        </h4>
        {contactName && (
          <p className="support-contact__name">
            {contactName}
          </p>
        )}
      </div>

      <div className="support-contact__actions">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="support-contact__btn support-contact__btn--phone"
            aria-label={`${t('callPartner')}: ${phone}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{t('callPartner')}</span>
          </a>
        )}

        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="support-contact__btn support-contact__btn--wa"
            aria-label={`${t('whatsappPartner')}: ${whatsappNumber}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>{t('whatsappPartner')}</span>
          </a>
        )}
      </div>
    </div>
  );
}
