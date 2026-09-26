import { useLanguage } from '@/hooks/useLanguage';

/**
 * SponsorContact — Direct communication and physical visit information
 */
export default function SponsorContact({ sponsor }) {
  const { t, getLocalized } = useLanguage();

  const {
    phone,
    whatsapp,
    website,
    instagram,
    facebook,
    address,
    mapsUrl,
  } = sponsor;

  const addressText = address ? getLocalized(address) : null;
  const resolvedMapsUrl = mapsUrl || (addressText ? `https://maps.google.com/?q=${encodeURIComponent(addressText)}` : null);
  const whatsappNumber = whatsapp || phone;
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('shareSuccessMessage'))}`
    : null;

  const hasAnyContact = phone || whatsappUrl || website || instagram || facebook || addressText;
  if (!hasAnyContact) return null;

  return (
    <section className="sponsor-contact" aria-labelledby="sponsor-contact-heading">
      <div className="sponsor-contact__card">
        <h3 id="sponsor-contact-heading" className="sponsor-contact__title">
          {t('contactSponsor')}
        </h3>

        {/* Action Buttons Grid */}
        <div className="sponsor-contact__actions-grid">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="sponsor-contact__btn sponsor-contact__btn--phone"
              aria-label={`${t('callPartner')}: ${phone}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{t('callPartner')}</span>
              <span className="sponsor-contact__btn-sub">{phone}</span>
            </a>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-contact__btn sponsor-contact__btn--wa"
              aria-label={`${t('whatsappPartner')}: ${whatsappNumber}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>{t('whatsappPartner')}</span>
              <span className="sponsor-contact__btn-sub">Chat</span>
            </a>
          )}

          {website && (
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-contact__btn sponsor-contact__btn--web"
              aria-label={`${t('visitWebsite')}: ${website}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{t('visitWebsite')}</span>
              <span className="sponsor-contact__btn-sub">↗</span>
            </a>
          )}

          {instagram && (
            <a
              href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-contact__btn sponsor-contact__btn--social"
              aria-label="Instagram"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>Instagram</span>
            </a>
          )}

          {facebook && (
            <a
              href={facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="sponsor-contact__btn sponsor-contact__btn--social"
              aria-label="Facebook"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
              <span>Facebook</span>
            </a>
          )}
        </div>

        {/* Address and Map */}
        {addressText && (
          <div className="sponsor-contact__address-block">
            <div className="sponsor-contact__address-text">
              <svg className="sponsor-contact__pin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <p>{addressText}</p>
            </div>

            {resolvedMapsUrl && (
              <a
                href={resolvedMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sponsor-contact__btn-maps"
              >
                <span>{t('openInGoogleMaps')}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
