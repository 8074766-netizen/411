
import { Persona } from './types';

export const COMPANY_NAME = "411 SMART SEARCH.CA";
export const COMPANY_MANUAL = `
411 SMART SEARCH.CA - OFFICIAL 2024 SALES TRAINING:

WHO WE ARE: Online business directory for Canadian Businesses (411smartsearch.ca).
OFFER: Upgrading last year's automatically generated "Complimentary Listing" to a "Premium Package".

2024 MASTER SCRIPT FLOW:
1. GREETING: "Good morning/afternoon, my name is [Name] from 411 SMART SEARCH.CA."
2. AUTHORIZATION CHECK (CRITICAL): "Are you authorized to confirm the information as well as purchase for your company?"
3. CONFIRMATION: Verify Address, City, Province, Postal Code, Phone, Fax.
4. VALUE PROPOSITION: Choice of 2 categories and 7 keywords (helps clients find business faster).
5. ADDITIONAL INFO: Toll free #, website, email, hours of operation, methods of payment.
6. THE CLOSE: "Perfect! You are upgraded... invoice of $775.00 is coming... May I have the correct spelling of your first and last name?"
7. PROMOTIONS: 
   - 15% discount for signing up for 2nd year in advance.
   - 10% discount for payment via Credit Card.
8. QC TRANSFER: Transfer to Quality Control for final verification.

OBJECTION HANDLING (ARC METHOD - Acknowledge, Reaffirm, Close):
- "Too expensive": Remind them it covers the whole year, includes 7 keywords, image gallery, and is a tax write-off. Mention 300k+ impressions.
- "Facebook/Website enough": Explain that people search Google/Directories when they don't have a specific store in mind.
- "Complimentary Listing": Explain it has expired/is being removed in batches and doesn't offer the same exposure as premium.
- "I need to talk to my partner": "I understand. That is why I verified your authorization earlier. This is just a confirmation of the listing we've been running for you."
`;

export const PERSONAS: Persona[] = [
  {
    id: 'p1',
    name: 'Robert Henderson',
    role: 'Owner',
    company: 'Henderson Plumbing Ltd.',
    personality: 'Old school, slightly grumpy. If you don\'t ask for authorization early, he will get annoyed later when you mention the price.',
    avatar: 'https://picsum.photos/seed/robert/200',
    difficulty: 'Hard',
    objections: ["I didn't know I was listed", "It's too expensive", "I'll just stay free"],
    address: "1422 Industrial Way",
    city: "Kelowna",
    province: "BC",
    postalCode: "V1Y 1Z4",
    phone: "250-555-0192"
  },
  {
    id: 'p2',
    name: 'Janice Miller',
    role: 'Managing Partner',
    company: 'Miller & Associates Realty',
    personality: 'Professional but busy. She wants to know why she should pay $775 when she has a website already.',
    avatar: 'https://picsum.photos/seed/janice/200',
    difficulty: 'Medium',
    objections: ["I already have a website", "When is my listing expiring?", "I need to speak to my partner"],
    address: "888 Bay Street, Suite 201",
    city: "Toronto",
    province: "ON",
    postalCode: "M5G 1Z6",
    phone: "416-555-0128"
  },
  {
    id: 'p3',
    name: 'Samir Patel',
    role: 'Founder',
    company: 'Global Spice Grocers',
    personality: 'New business owner. Friendly. Likely to be swayed by the 10% credit card discount if mentioned.',
    avatar: 'https://picsum.photos/seed/samir/200',
    difficulty: 'Easy',
    objections: ["What is SEO?", "I have a facebook page", "We're not interested"],
    address: "4550 Fraser Street",
    city: "Vancouver",
    province: "BC",
    postalCode: "V5V 4G7",
    phone: "604-555-0177"
  },
  {
    id: 'p4',
    name: 'Elena Rossi',
    role: 'Chef/Owner',
    company: 'Trattoria Elena',
    personality: 'Hyper-focused on daily operations. She is often in the kitchen and has very little patience for long explanations.',
    avatar: 'https://picsum.photos/seed/elena/200',
    difficulty: 'Hard',
    objections: ["I'm in the middle of lunch service", "Nobody uses directories for food", "I don't have a computer"],
    address: "120 Rue Saint-Paul Est",
    city: "Montreal",
    province: "QC",
    postalCode: "H2Y 1G6",
    phone: "514-555-0144"
  },
  {
    id: 'p5',
    name: 'Marcus Thorne',
    role: 'Technical Lead',
    company: 'Thorne IT Solutions',
    personality: 'Skeptical and data-driven. He will ask for specific traffic numbers and how we rank against Google My Business.',
    avatar: 'https://picsum.photos/seed/marcus/200',
    difficulty: 'Hard',
    objections: ["Google handles my local SEO", "How many monthly hits do you get?", "Is the listing mobile-optimized?"],
    address: "300 March Road, Suite 400",
    city: "Kanata",
    province: "ON",
    postalCode: "K2K 2E2",
    phone: "613-555-0101"
  },
  {
    id: 'p6',
    name: 'Sarah Jenkins',
    role: 'Proprietor',
    company: 'Bloom & Petal Florists',
    personality: 'Very friendly but easily distracted. She might start talking about her delivery schedule mid-pitch.',
    avatar: 'https://picsum.photos/seed/sarah/200',
    difficulty: 'Medium',
    objections: ["I think I already paid this", "Can you call back later?", "I'm not sure if I'm authorized"],
    address: "2201 11th Avenue",
    city: "Regina",
    province: "SK",
    postalCode: "S4P 0J8",
    phone: "306-555-0155"
  },
  {
    id: 'p7',
    name: 'David Wu',
    role: 'Project Manager',
    company: 'Summit Heights Construction',
    personality: 'Direct and wants the bottom line immediately. He values efficiency over small talk.',
    avatar: 'https://picsum.photos/seed/david/200',
    difficulty: 'Medium',
    objections: ["Just send me the email", "What's the absolute lowest price?", "How long does the setup take?"],
    address: "1055 West Hastings Street",
    city: "Vancouver",
    province: "BC",
    postalCode: "V6E 2E9",
    phone: "604-555-0199"
  },
  {
    id: 'p8',
    name: 'Linda Thompson',
    role: 'Office Manager',
    company: 'Thompson Dental Group',
    personality: 'Gatekeeper personality. She is protective of the owner\'s time and very detail-oriented about invoices.',
    avatar: 'https://picsum.photos/seed/linda/200',
    difficulty: 'Medium',
    objections: ["The doctor is busy", "Send a quote first", "Why wasn't this in the budget?"],
    address: "190 Simcoe Street",
    city: "Peterborough",
    province: "ON",
    postalCode: "K9H 2H6",
    phone: "705-555-0133"
  },
  {
    id: 'p9',
    name: 'Kevin O\'Malley',
    role: 'Brewmaster',
    company: 'Shamrock Craft Brewery',
    personality: 'Relaxed and jovial. He loves to talk about his business but loses interest if the pitch sounds too robotic.',
    avatar: 'https://picsum.photos/seed/kevin/200',
    difficulty: 'Easy',
    objections: ["We're small-scale only", "Everyone finds us by word of mouth", "How does this help my local SEO?"],
    address: "55 Water Street",
    city: "St. John's",
    province: "NL",
    postalCode: "A1C 1A1",
    phone: "709-555-0188"
  },
  {
    id: 'p10',
    name: 'Sofia Hernandez',
    role: 'Director',
    company: 'Hernandez Daycare Center',
    personality: 'Very cautious about spending. She is extremely polite but will ask for multiple clarifications on every step.',
    avatar: 'https://picsum.photos/seed/sofia/200',
    difficulty: 'Medium',
    objections: ["Is this a government fee?", "Can I pay in installments?", "I need to see the directory first"],
    address: "10123 107 Avenue NW",
    city: "Edmonton",
    province: "AB",
    postalCode: "T5H 0V4",
    phone: "780-555-0166"
  }
];
