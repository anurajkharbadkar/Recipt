/**
 * E-PavtiBook — Mandal Type Definitions (JSDoc)
 *
 * These types define the data shape for Mandal pages with genuine multilingual support.
 * Supports Marathi (mr), Hindi (hi), and English (en).
 */

/**
 * @typedef {import('./language.js').LanguageCode} LanguageCode
 * @typedef {import('./language.js').LocalizedText} LocalizedText
 * @typedef {import('./language.js').OptionalLocalizedText} OptionalLocalizedText
 */

/**
 * @typedef {Object} MandalMilestone
 * @property {string} id
 * @property {number} year
 * @property {LocalizedText} title
 * @property {LocalizedText} description
 * @property {string} [image]
 * @property {string} [category]
 */

/**
 * @typedef {Object} CommunityStats
 * @property {number} [families]
 * @property {number} [volunteers]
 * @property {number} [yearsActive]
 * @property {number} [socialInitiatives]
 * @property {number} [culturalPrograms]
 */

/**
 * @typedef {Object} SocialInitiative
 * @property {string} id
 * @property {LocalizedText} title
 * @property {LocalizedText} description
 * @property {string} [category]
 * @property {string} [icon]
 * @property {number} [year]
 */

/**
 * @typedef {Object} MandalAchievement
 * @property {string} id
 * @property {LocalizedText} title
 * @property {LocalizedText} [description]
 * @property {number} [year]
 * @property {LocalizedText} [conferredBy]
 */

/**
 * @typedef {Object} MandalHistory
 * @property {number} [establishmentYear]
 * @property {LocalizedText} description
 * @property {MandalMilestone[]} milestones
 * @property {CommunityStats} [communityStats]
 * @property {(LocalizedText | MandalAchievement)[]} [achievements]
 * @property {(LocalizedText | SocialInitiative)[]} [socialActivities]
 */

/**
 * @typedef {Object} DressCode
 * @property {number} dayNumber
 * @property {string} date
 * @property {LocalizedText} theme
 * @property {LocalizedText} [description]
 * @property {string} [image]
 */

/**
 * @typedef {Object} FestivalDayEvent
 * @property {string} [id]
 * @property {LocalizedText} title
 * @property {string} [titleMarathi]
 * @property {string} startTime
 * @property {string} [time]
 * @property {string} [endTime]
 * @property {LocalizedText} [venue]
 * @property {LocalizedText} [description]
 * @property {string} [eventCategory]
 * @property {string} [eventType]
 * @property {LocalizedText[]} [activities]
 * @property {LocalizedText} [participationInfo]
 * @property {string} [image]
 * @property {string} [sponsorId]
 */

/**
 * @typedef {Object} FestivalDay
 * @property {number} dayNumber
 * @property {number} day
 * @property {string} date
 * @property {LocalizedText} [title]
 * @property {LocalizedText} [description]
 * @property {LocalizedText} [goddess]
 * @property {string} [goddessMarathi]
 * @property {string} [color]
 * @property {string} [colorHex]
 * @property {DressCode} [dressCode]
 * @property {FestivalDayEvent[]} events
 * @property {LocalizedText[]} [activities]
 * @property {LocalizedText} [participationInfo]
 * @property {string} [eventCategory]
 * @property {string} [image]
 * @property {string} [sponsorId]
 */

/**
 * @typedef {Object} BhandaraMenuItem
 * @property {string} id
 * @property {LocalizedText} name
 * @property {LocalizedText} [category]
 */

/**
 * @typedef {Object} Bhandara
 * @property {LocalizedText} title
 * @property {string} date
 * @property {string} [startTime]
 * @property {string} [endTime]
 * @property {LocalizedText} venue
 * @property {LocalizedText} [address]
 * @property {LocalizedText} [landmark]
 * @property {string} [mapsUrl]
 * @property {BhandaraMenuItem[]} menu
 * @property {LocalizedText} [description]
 * @property {LocalizedText[]} [instructions]
 * @property {string} [sponsorId]
 * @property {string} [image]
 */

/**
 * @typedef {Object} VisarjanRouteStop
 * @property {number} order
 * @property {LocalizedText} name
 * @property {LocalizedText} [landmark]
 * @property {string} [estimatedTime]
 */

/**
 * @typedef {Object} VisarjanLocation
 * @property {LocalizedText} name
 * @property {LocalizedText} [address]
 * @property {string} [mapsUrl]
 */

/**
 * @typedef {Object} Visarjan
 * @property {LocalizedText} title
 * @property {string} date
 * @property {string} startTime
 * @property {string} [endTime]
 * @property {LocalizedText | VisarjanLocation} assemblyPoint
 * @property {LocalizedText} [assemblyAddress]
 * @property {string} [assemblyMapsUrl]
 * @property {VisarjanRouteStop[]} route
 * @property {LocalizedText | VisarjanLocation} endPoint
 * @property {LocalizedText} [endAddress]
 * @property {string} [endMapsUrl]
 * @property {LocalizedText} [description]
 * @property {LocalizedText[]} [importantInstructions]
 * @property {ActivityContact | string} [contact]
 * @property {string} [sponsorId]
 */

/**
 * @typedef {Object} ActivityContact
 * @property {LocalizedText} [name]
 * @property {string} [phone]
 * @property {string} [whatsapp]
 */

/**
 * @typedef {Object} Competition
 * @property {string} id
 * @property {LocalizedText} title
 * @property {LocalizedText} description
 * @property {string} [date]
 * @property {string} [startTime]
 * @property {string} [endTime]
 * @property {LocalizedText} [venue]
 * @property {LocalizedText} [eligibility]
 * @property {LocalizedText} [registrationInfo]
 * @property {boolean} [registrationRequired]
 * @property {string} [registrationUrl]
 * @property {LocalizedText[]} [rules]
 * @property {ActivityContact | string} [contact]
 * @property {string} [sponsorId]
 * @property {string} [category]
 * @property {boolean} [isFeatured]
 * @property {string} [image]
 */

/**
 * @typedef {Object} Announcement
 * @property {string} id
 * @property {LocalizedText} title
 * @property {LocalizedText} description
 * @property {string} date
 * @property {'normal' | 'important' | 'urgent'} priority
 * @property {boolean} active
 */

/**
 * @typedef {Object} DeviInfo
 * @property {LocalizedText} name
 * @property {LocalizedText} [avatar]
 * @property {LocalizedText} [description]
 * @property {string} [imageUrl]
 * @property {LocalizedText} [blessingMessage]
 */

/**
 * @typedef {Object} CommunityInfo
 * @property {LocalizedText} size
 * @property {LocalizedText} [description]
 * @property {LocalizedText} [president]
 * @property {LocalizedText} [secretary]
 * @property {{ name: LocalizedText; role: LocalizedText }[]} [committeeMembers]
 */

/**
 * @typedef {Object} MandalIdentity
 * @property {LocalizedText} name
 * @property {string} [nameMarathi]
 * @property {string} slug
 * @property {LocalizedText} tagline
 * @property {string} [taglineMarathi]
 * @property {number} [established]
 * @property {LocalizedText} [communitySize]
 * @property {LocalizedText} [description]
 * @property {string} [descriptionMarathi]
 * @property {string} [logoUrl]
 * @property {string} [heroImageUrl]
 * @property {string} [aboutImageUrl]
 */

/**
 * @typedef {Object} Festival
 * @property {LocalizedText} name
 * @property {string} [nameMarathi]
 * @property {string} startDate
 * @property {string} endDate
 * @property {string} [dussehraDate]
 * @property {string} year
 * @property {number} [totalDays]
 * @property {LocalizedText} [description]
 * @property {LocalizedText} [theme]
 */

/**
 * @typedef {Object} SponsorOffer
 * @property {LocalizedText} title
 * @property {LocalizedText} [description]
 * @property {LocalizedText} [badge]
 * @property {string} [discount]
 * @property {string} [code]
 * @property {string} [validUntil]
 * @property {LocalizedText | string} [terms]
 */

/**
 * @typedef {Object} Sponsor
 * @property {string} id
 * @property {string} [slug]
 * @property {LocalizedText} name
 * @property {string} [logo]
 * @property {string} [logoUrl]
 * @property {'presenting' | 'platinum' | 'gold' | 'silver' | 'community' | 'festival' | 'supporter'} tier
 * @property {LocalizedText | string} [category]
 * @property {LocalizedText} [description]
 * @property {LocalizedText} [shortDescription]
 * @property {LocalizedText} [fullDescription]
 * @property {string} [initials]
 * @property {SponsorOffer} [offer]
 * @property {string} [website]
 * @property {string} [instagram]
 * @property {string} [facebook]
 * @property {string} [phone]
 * @property {string} [whatsapp]
 * @property {LocalizedText} [address]
 * @property {string} [mapsUrl]
 * @property {boolean} [featured]
 * @property {LocalizedText | string} [eventAssociation]
 * @property {string} [eventId]
 * @property {string[]} [eventIds]
 * @property {boolean} [sponsorOfTheDay]
 */

/**
 * @typedef {Object} GalleryImage
 * @property {string} id
 * @property {string} src
 * @property {string} [image]
 * @property {LocalizedText} alt
 * @property {LocalizedText} [altText]
 * @property {LocalizedText} [caption]
 * @property {string} [category]
 * @property {string} [date]
 * @property {number} [year]
 * @property {string} [sponsorId]
 * @property {boolean} [featured]
 * @property {number} [order]
 */

/**
 * @typedef {Object} MandalLocation
 * @property {LocalizedText} venue
 * @property {LocalizedText} address
 * @property {LocalizedText} [landmark]
 * @property {LocalizedText} city
 * @property {LocalizedText} state
 * @property {string} [mapsUrl]
 * @property {number} [lat]
 * @property {number} [lng]
 */

/**
 * @typedef {Object} Contact
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [whatsapp]
 */

/**
 * @typedef {Object} Social
 * @property {string} [facebook]
 * @property {string} [instagram]
 * @property {string} [youtube]
 * @property {string} [twitter]
 */

/**
 * @typedef {Object} Mandal
 * @property {MandalIdentity} identity
 * @property {DeviInfo} [devi]
 * @property {Festival} festival
 * @property {number} [establishedYear]
 * @property {MandalHistory} [history]
 * @property {MandalMilestone[]} [milestones]
 * @property {CommunityStats} [communityStats]
 * @property {SocialInitiative[]} [socialInitiatives]
 * @property {MandalAchievement[]} [achievements]
 * @property {FestivalDay[]} [festivalDays]
 * @property {FestivalDay[]} schedule
 * @property {DressCode[]} [dailyDressCodes]
 * @property {Bhandara | null} [bhandara]
 * @property {Competition[]} [competitions]
 * @property {Announcement[]} [announcements]
 * @property {Visarjan | null} [visarjan]
 * @property {CommunityInfo} [community]
 * @property {Sponsor[]} sponsors
 * @property {Sponsor | string} [sponsorOfTheDay]
 * @property {GalleryImage[]} gallery
 * @property {MandalLocation} location
 * @property {Contact} [contact]
 * @property {Social} [social]
 * @property {DonationConfig | null} [donation]
 */

/**
 * @typedef {Object} BankDetails
 * @property {string} accountName
 * @property {string} accountNumber
 * @property {string} bankName
 * @property {string} ifsc
 * @property {string} [branch]
 * @property {string} [accountType]
 */

/**
 * @typedef {Object} DonationContact
 * @property {LocalizedText} [name]
 * @property {string} [phone]
 * @property {string} [whatsapp]
 */

/**
 * @typedef {Object} DonationConfig
 * @property {boolean} enabled
 * @property {LocalizedText} [title]
 * @property {LocalizedText} [description]
 * @property {string} [upiId]
 * @property {string} [upiName]
 * @property {string} [qrImage]
 * @property {string} [paymentUrl]
 * @property {BankDetails} [bankDetails]
 * @property {number[]} [suggestedAmounts]
 * @property {DonationContact} [contact]
 * @property {LocalizedText[]} [instructions]
 * @property {LocalizedText} [thankYouMessage]
 * @property {LocalizedText} [transparencyNote]
 */

export default {};
