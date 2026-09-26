import { useMandal } from '@/context/MandalContext';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDateRange } from '@/utils/dateUtils';
import './Footer.css';

export default function Footer() {
  const { identity, festival, location, contact, social } = useMandal();
  const { t, getLocalized } = useLanguage();
  const dateRange = formatDateRange(festival.startDate, festival.endDate);

  const mandalName = getLocalized(identity.name);
  const tagline = getLocalized(identity.tagline);
  const festivalName = getLocalized(festival.name);
  const address = getLocalized(location.address);
  const initials = mandalName ? mandalName.slice(0, 2) : 'मं';

  const navItems = [
    { label: t('schedule'), href: '#schedule' },
    { label: t('ourStory'), href: '#about' },
    { label: t('sponsors'), href: '#sponsors' },
    { label: t('gallery'), href: '#gallery' },
    { label: t('location'), href: '#location' },
    { label: t('share'), href: '#share' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer__inner">
          {/* Brand */}
          <div className="footer__brand">
            <div className="footer__brand-identity">
              <span className="footer__brand-icon" aria-hidden="true">{initials}</span>
              <span className="footer__brand-name">{mandalName}</span>
            </div>
            <p className="footer__brand-description">
              {tagline}
            </p>
            <p className="footer__brand-description" style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>
              {festivalName} • {dateRange}
            </p>

            {/* Social */}
            {social && (
              <div className="footer__social">
                {social.instagram && (
                  <a href={social.instagram} className="footer__social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} className="footer__social-link" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}
                {social.youtube && (
                  <a href={social.youtube} className="footer__social-link" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="footer__nav" aria-label="Footer navigation">
            <p className="footer__nav-title">{t('home')}</p>
            {navItems.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="footer__nav-link"
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Info */}
          <div className="footer__info">
            <p className="footer__nav-title">{t('location')}</p>

            <div className="footer__info-item">
              <svg className="footer__info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>{address}</span>
            </div>

            {contact?.phone && (
              <div className="footer__info-item">
                <svg className="footer__info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <a href={`tel:${contact.phone}`} className="footer__nav-link">{contact.phone}</a>
              </div>
            )}

            {contact?.email && (
              <div className="footer__info-item">
                <svg className="footer__info-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
                <a href={`mailto:${contact.email}`} className="footer__nav-link">{contact.email}</a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="footer__bottom">
          <p className="footer__powered">
            {t('poweredBy')} <span className="footer__powered-brand">E-PavtiBook</span>
          </p>
          <p className="footer__copyright">
            © {new Date().getFullYear()} {mandalName}. {t('allRightsReserved')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
