export interface TourStep {
  id: string;
  title: { mr: string; hi: string; en: string };
  description: { mr: string; hi: string; en: string };
  targetSelector?: string;
  badge?: { mr: string; hi: string; en: string };
}

export interface PageTour {
  pageKey: string;
  pagePath: string;
  title: { mr: string; hi: string; en: string };
  steps: TourStep[];
}

export const PAGE_TOURS: Record<string, PageTour> = {
  dashboard: {
    pageKey: 'dashboard',
    pagePath: '/dashboard',
    title: {
      mr: 'डॅशबोर्ड मार्गदर्शन (Dashboard Guide)',
      hi: 'डैशबोर्ड गाइड (Dashboard Guide)',
      en: 'Dashboard Overview & Quick Guide',
    },
    steps: [
      {
        id: 'overview',
        title: {
          mr: '१. जमा व संकलन प्रगती (Collection Summary)',
          hi: '1. कुल संग्रह और प्रगति (Collection Summary)',
          en: '1. Collection & Financial Summary',
        },
        description: {
          mr: 'येथे तुम्हाला उत्सवाची एकूण जमा रक्कम, आजची जमा, एकूण पावत्या आणि कार्यकर्त्यांचे योगदान एका दृष्टीक्षेपात दिसेल.',
          hi: 'यहां आप उत्सव की कुल राशि, आज का संग्रह, कुल रसीदें और कार्यकर्ताओं का योगदान एक नज़र में देख सकते हैं।',
          en: 'View total collections, today\'s receipts, expense totals, and active collector numbers at a glance.',
        },
        badge: { mr: 'महत्त्वाचे', hi: 'मुख्य', en: 'Overview' },
      },
      {
        id: 'new-receipt-btn',
        title: {
          mr: '२. नवीन पावती फाडा (+ New Receipt)',
          hi: '2. नई रसीद काटें (+ New Receipt)',
          en: '2. Quick Pavti Creation (+ New Receipt)',
        },
        description: {
          mr: 'कोणत्याही देणगीदाराकडून वर्गणी किंवा देणगी स्वीकारल्यावर त्वरित डिजिटल पावती तयार करण्यासाठी "+ New Receipt" बटणावर क्लिक करा.',
          hi: 'किसी भी दानदाता से दान या चंदा प्राप्त करने पर तुरंत डिजिटल रसीद बनाने के लिए "+ New Receipt" बटन का उपयोग करें।',
          en: 'Click "+ New Receipt" anytime to issue an instant digital receipt via Cash, UPI, or Cheque.',
        },
        badge: { mr: 'मुख्य कृती', hi: 'मुख्य कार्य', en: 'Key Action' },
      },
      {
        id: 'leaderboard',
        title: {
          mr: '३. कार्यकर्ता योगदान तक्ता (Collector Leaderboard)',
          hi: '3. कार्यकर्ता संग्रह तालिका (Collector Leaderboard)',
          en: '3. Collector & Karyakarta Performance',
        },
        description: {
          mr: 'कोणत्या कार्यकर्त्याने किती पावत्या फाडल्या आणि किती रक्कम जमा केली याचा थेट तक्ता पाहता येतो.',
          hi: 'किस कार्यकर्ता ने कितनी रसीदें काटीं और कितनी राशि एकत्र की, इसका सीधा रिपोर्ट देखें।',
          en: 'Track receipts issued and collections raised by each Karyakarta in real-time.',
        },
      },
    ],
  },

  receipts_new: {
    pageKey: 'receipts_new',
    pagePath: '/receipts/new',
    title: {
      mr: 'नवीन पावती मार्गदर्शन (New Receipt Guide)',
      hi: 'नई रसीद मार्गदर्शन (New Receipt Guide)',
      en: 'Issuing a New Digital Receipt',
    },
    steps: [
      {
        id: 'donor-info',
        title: {
          mr: '१. देणगीदाराची माहिती (Donor Details)',
          hi: '1. दानदाता की जानकारी (Donor Details)',
          en: '1. Donor Details & Phone',
        },
        description: {
          mr: 'देणगीदाराचे नाव आणि व्हॉट्सॲप नंबर टाका. पूर्वीच्या देणगीदारांचे नाव आपोआप सुचवले जाते.',
          hi: 'दानदाता का नाम और व्हाट्सएप नंबर दर्ज करें। पुराने दानदाताओं के नाम स्वतः सुझाये जाते हैं।',
          en: 'Enter donor name and WhatsApp number. Past donors are automatically suggested for fast entry.',
        },
      },
      {
        id: 'payment-mode',
        title: {
          mr: '२. पेमेंट पद्धत व प्रकार (Payment Mode & Category)',
          hi: '2. भुगतान माध्यम और श्रेणी (Payment Mode)',
          en: '2. Payment Mode & Category',
        },
        description: {
          mr: 'रोख (Cash), UPI किंवा चेक निवडा. वर्गणी, जाहिरात किंवा अन्नदान यापैकी प्रकार निवडा.',
          hi: 'नकद (Cash), UPI या चेक चुनें। चंदा, विज्ञापन या अन्नदान श्रेणी का चयन करें।',
          en: 'Choose Cash, UPI, or Cheque. Categorize the contribution (General, Advertisement, Annadaan, etc.).',
        },
      },
      {
        id: 'whatsapp-share',
        title: {
          mr: '३. व्हॉट्सॲपवर त्वरित पाठवा (Instant WhatsApp Share)',
          hi: '3. व्हाट्सएप पर तुरंत भेजें (Instant WhatsApp Share)',
          en: '3. Instant WhatsApp Receipt Delivery',
        },
        description: {
          mr: 'पावती तयार झाल्यावर "Share via WhatsApp" वर क्लिक करून थेट देणगीदाराच्या मोबाईलवर आकर्षक डिजिटल पावती मेसेज पाठवा.',
          hi: 'रसीद बनने के बाद "Share via WhatsApp" पर क्लिक करके सीधे दानदाता के मोबाइल पर सुंदर डिजिटल रसीद भेजें।',
          en: 'After saving, click "Share via WhatsApp" to send a pre-formatted receipt message directly to the donor.',
        },
        badge: { mr: 'लोकप्रिय', hi: 'लोकप्रिय', en: 'Feature' },
      },
    ],
  },

  campaigns: {
    pageKey: 'campaigns',
    pagePath: '/campaigns',
    title: {
      mr: 'उत्सव व इवेंट्स मार्गदर्शन (Events Guide)',
      hi: 'इवेंट्स मार्गदर्शन (Events Guide)',
      en: 'Event & Festival Management',
    },
    steps: [
      {
        id: 'active-campaign',
        title: {
          mr: '१. सक्रिय उत्सव निवडा (Active Event Selection)',
          hi: '1. सक्रिय इवेंट चुनें (Active Event)',
          en: '1. Active Festival / Campaign',
        },
        description: {
          mr: 'सध्या चालू असलेल्या उत्सवाला (उदा. गणेशोत्सव २०२६) सक्रिय करा. सर्व पावत्या याच उत्सवाखाली जमा होतात.',
          hi: 'वर्तमान में चल रहे उत्सव (उदा. गणेश उत्सव 2026) को सक्रिय करें। सभी रसीदें इसी इवेंट में जुड़ेंगी।',
          en: 'Set your currently running festival as ACTIVE. All new receipts and expenses tag under this campaign.',
        },
      },
      {
        id: 'target-tracking',
        title: {
          mr: '२. उद्दिष्ट व जमा अंदाज (Target Tracking)',
          hi: '2. लक्ष्य और संग्रह ट्रैक (Target Tracking)',
          en: '2. Target vs Collection Tracking',
        },
        description: {
          mr: 'उत्सवाचे लक्ष्य रक्कम (Target Amount) ठरवा आणि किती जमा झाली याची टक्केवारी पहा.',
          hi: 'उत्सव का लक्ष्य राशि तय करें और अब तक हुए संग्रह का प्रतिशत देखें।',
          en: 'Define target amounts and monitor live completion percentages for each festival year.',
        },
      },
    ],
  },

  members: {
    pageKey: 'members',
    pagePath: '/members',
    title: {
      mr: 'कार्यकर्ते व सभासद मार्गदर्शन (Members Guide)',
      hi: 'कार्यकर्ता और सदस्य मार्गदर्शन (Members Guide)',
      en: 'Team & Karyakarta Management',
    },
    steps: [
      {
        id: 'add-collector',
        title: {
          mr: '१. नवीन कार्यकर्ता जोडा (+ Add Collector)',
          hi: '1. नया कार्यकर्ता जोड़ें (+ Add Collector)',
          en: '1. Add Karyakartas & Collectors',
        },
        description: {
          mr: 'मंडळातील कार्यकर्त्यांना मोबाईल नंबर व पासवर्ड देऊन नोंदवा, जेणेकरून ते आपापल्या फोनवरून पावती फाडू शकतील.',
          hi: 'मंडल के कार्यकर्ताओं को मोबाइल नंबर और पासवर्ड देकर जोड़ें ताकि वे अपने फोन से रसीद काट सकें।',
          en: 'Register collectors with phone numbers and passwords so they can log in on mobile to issue receipts.',
        },
      },
      {
        id: 'roles-access',
        title: {
          mr: '२. पद व अधिकार (Roles & Access)',
          hi: '2. पद और अधिकार (Roles & Access)',
          en: '2. Roles & Permissions',
        },
        description: {
          mr: 'अध्यक्ष, खजिनदार (Treasurer) किंवा कार्यकर्ता (Collector) असा रोल निवडून योग्य सुरक्षा अधिकार द्या.',
          hi: 'अध्यक्ष, कोषाध्यक्ष या कार्यकर्ता का रोल चुनें और सही सुरक्षा अधिकार प्रदान करें।',
          en: 'Assign roles (Org Admin, Treasurer, Collector) to strictly control access to settings and finance.',
        },
      },
    ],
  },

  settings: {
    pageKey: 'settings',
    pagePath: '/settings',
    title: {
      mr: 'मंडळ सेटिंग्ज मार्गदर्शन (Settings Guide)',
      hi: 'मंडल सेटिंग्स मार्गदर्शन (Settings Guide)',
      en: 'Organization Setup & Settings',
    },
    steps: [
      {
        id: 'bank-upi',
        title: {
          mr: '१. बँक व UPI ID (Bank Account & UPI VPA)',
          hi: '1. बैंक और UPI ID (Bank Account & UPI)',
          en: '1. Mandal Bank & UPI Details',
        },
        description: {
          mr: 'मंडळाचा UPI ID (उदा. mandal@upi) टाका, जेणेकरून डिजिटल पावतीवर क्यूआर कोड (QR Code) तयार होईल.',
          hi: 'मंडल की UPI ID (जैसे mandal@upi) दर्ज करें ताकि डिजिटल रसीद पर QR कोड बन सके।',
          en: 'Enter your Mandal\'s UPI ID to automatically embed a scannable payment QR code on public receipts.',
        },
      },
      {
        id: 'receipt-design',
        title: {
          mr: '२. पावती डिझाइन व बोधवाक्य (Receipt Branding & Mantra)',
          hi: '2. रसीद डिज़ाइन और मंत्र (Receipt Branding)',
          en: '2. Custom Themes & Devotional Mantras',
        },
        description: {
          mr: 'पावतीवर छापला जाणारा श्लोक/मंत्र, थीम रंग आणि लोगो निवडून पावती अधिक आकर्षक बनवा.',
          hi: 'रसीद पर छपने वाला श्लोक, थीम रंग और लोगो चुनकर रसीद को और सुंदर बनाएं।',
          en: 'Customize devotional mantras, brand colors, and receipt headers to match your Mandal\'s tradition.',
        },
      },
    ],
  },

  reports: {
    pageKey: 'reports',
    pagePath: '/reports',
    title: {
      mr: 'अहवाल व हिशोब मार्गदर्शन (Reports Guide)',
      hi: 'रिपोर्ट और लेखा-जोखा मार्गदर्शन (Reports Guide)',
      en: 'Financial Reports & Analytics',
    },
    steps: [
      {
        id: 'pdf-export',
        title: {
          mr: '१. जमा-खर्च अहवाल डाउनलोड करा (Download Statements)',
          hi: '1. जमा-खर्च रिपोर्ट डाउनलोड करें (Statements)',
          en: '1. Export Statements & Excel/CSV',
        },
        description: {
          mr: 'एका क्लिकवर संपूर्ण उत्सवाचा जमा-खर्च अहवाल (PDF / Excel CSV) डाउनलोड करा.',
          hi: 'एक क्लिक में पूरे उत्सव की जमा-खर्च रिपोर्ट (PDF / Excel CSV) डाउनलोड करें।',
          en: 'Export clean audit-ready PDF income-expenditure statements and CSV donor ledgers anytime.',
        },
      },
    ],
  },
};
