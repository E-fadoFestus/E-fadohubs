export type HubGuideId =
  | 'games'
  | 'vtu'
  | 'cryptoOtc'
  | 'moneyExchange'
  | 'marketplace'
  | 'advertising'
  | 'skills'
  | 'serviceCorps'
  | 'loans'
  | 'cscc'
  | 'education'
  | 'nexus'
  | 'domainsPartners'
  | 'walletPaystack'
  | 'ceoPortal';

export interface HubGuideContent {
  id: HubGuideId;
  title: string;
  whatIsThis: string;
  steps: string[];
  whatHappensNext: string;
  example: string;
  helpCategory:
    | 'General Help'
    | 'Technical Hub Issues'
    | 'Wallet & Payments'
    | 'Live Teaching / Zoom'
    | 'System Bug / Error';
}

export const HUB_GUIDES: Record<HubGuideId, HubGuideContent> = {
  games: {
    id: 'games',
    title: 'Game Zone Guide (All 6 Games)',
    whatIsThis:
      'Play 6 real-money skill and luck games (Deep Sea Jet, Lucky Spin, Money Card, Digital Money Trading, Equilibrium, and Money Quiz) using one shared wallet.',
    steps: [
      'Check your wallet balance at the top. If your balance is low, tap "Fund" — it takes you straight to your Account Profile Wallet to add money via Paystack.',
      'Pick any of the 6 games, type your stake (from ₦100 or ₦200 depending on the game), and tap Play or Launch.',
      'Cash out or finish your round before a crash or timer ends to lock in your multiplier win.',
      'To take your profit out, tap "Cash Out" — it takes you to your Profile Wallet to send money straight to your bank.'
    ],
    whatHappensNext:
      'Your stake leaves your Deposit Wallet as you play, every win enters your Win Wallet right away, and you can check all rounds in Wallet -> History.',
    example:
      'If you fund ₦1,000 in your Profile Wallet and stake ₦200 on Deep Sea Jet at 2.5x cashout, ₦500 enters your Win Wallet automatically.',
    helpCategory: 'Wallet & Payments'
  },
  vtu: {
    id: 'vtu',
    title: 'VTU Airtime & Data Guide',
    whatIsThis:
      'Buy MTN, Airtel, Glo, or international airtime and data bundles fast using your EFADO Deposit Wallet or Win Wallet.',
    steps: [
      'Choose your Country, Network Operator, and pick either "Airtime" or "Data Bundle".',
      'Type the phone number carefully and pick the amount or data plan you want.',
      'Select "Win Wallet" or "Deposit Wallet" to pay (tap "Fund Wallet" first if you need to add money via Paystack).',
      'Tap "Process VTU Topup" and wait a few seconds for confirmation.'
    ],
    whatHappensNext:
      'The airtime or data delivers to the phone number within seconds, and your receipt shows up in the live trace log and Wallet -> History.',
    example:
      'If you want 3GB MTN data for ₦1,000, pick Nigeria -> MTN -> Data Bundle -> 3GB plan, pay from your wallet, and your line gets credited right away.',
    helpCategory: 'Wallet & Payments'
  },
  cryptoOtc: {
    id: 'cryptoOtc',
    title: 'Crypto OTC Swap Guide',
    whatIsThis:
      'Swap USDT, BTC, ETH, or supported tokens for Naira or other fiat currencies paid straight to your bank account.',
    steps: [
      'Choose the crypto coin you want to sell, enter the amount, and select the currency you want to receive.',
      'Tap "Get Live OTC Quote" to see the current rate, the 5% service fee, and your exact final payout.',
      'Enter your receiving bank details carefully, then send the exact crypto amount to the wallet address shown.',
      'Paste your transaction hash (TxHash) and tap Confirm so we verify your transfer.'
    ],
    whatHappensNext:
      'Once the blockchain transfer is confirmed, your net fiat payout is routed to your bank account and logged in Audit Logs.',
    example:
      'If you want to cash out 100 USDT to Naira, check the quote first, send 100 USDT to the shown address, paste your TxHash, and receive NGN in your bank.',
    helpCategory: 'Wallet & Payments'
  },
  moneyExchange: {
    id: 'moneyExchange',
    title: 'Money Exchange Guide',
    whatIsThis:
      'Convert money from one currency to another (like USD, GBP, EUR, NGN, or GHS) at clear live rates and send to a bank account.',
    steps: [
      'Pick the "From" currency you have and the "To" currency you want to send or receive.',
      'Type the amount and check the live exchange rate and fee shown on screen before you continue.',
      'Fill in the receiver’s exact full name, bank or mobile money provider, and account number.',
      'Tap "Process Money Exchange" (or "Execute Conversion") to confirm and dispatch.'
    ],
    whatHappensNext:
      'The exchange rate locks in your net payout after the stated fee, and your transaction receipt appears in Audit Logs and CEO monitoring.',
    example:
      'If you are converting $100 USD to Naira for family back home, type 100 USD -> NGN, check the net Naira amount shown, enter their OPay or bank details, and send.',
    helpCategory: 'Wallet & Payments'
  },
  marketplace: {
    id: 'marketplace',
    title: 'Marketplace Guide (Modern & Fairly Used)',
    whatIsThis:
      'Buy and sell brand-new or neatly used items safely with Escrow protection and direct Paystack or Profile Wallet payment.',
    steps: [
      'To buy: browse categories, tap an item to inspect photos or chat the seller, add to cart, and pay securely at checkout.',
      'To sell: tap "Vendor Registration" or "Register & Upload Products", add clear photos, honest condition notes, price, and your location.',
      'Wait for buyers to order or message you in the item view, then confirm pickup or delivery.',
      'Track every order status and delivery update inside "My Orders & Tracking".'
    ],
    whatHappensNext:
      'When you pay at checkout, your order is recorded right away, and sellers get paid through Escrow once order delivery is confirmed.',
    example:
      'If you have a fairly used laptop or new shoes to sell, upload 2–3 clear photos, put the real price, and buyers can pay safely via Wallet or Paystack.',
    helpCategory: 'Technical Hub Issues'
  },
  advertising: {
    id: 'advertising',
    title: 'Advertisement & Sell Page Guide',
    whatIsThis:
      'Promote your business, farm produce, property, church program, event, or skills to reach buyers across the whole EFADO platform.',
    steps: [
      'Choose "Advertise" (for hotels, events, services, skills) or "Sell Now" (for farm goods, cars, land, products).',
      'Tap "Register Ad / Listing", pick your category, upload clear photos or videos, and fill in your honest price and contact details.',
      'Pick an ad plan (start with the 3-Day Free Plan or choose a paid boost plan using your Profile Wallet or Paystack).',
      'Submit your listing so it goes live immediately.'
    ],
    whatHappensNext:
      'Your advert appears across the Advertising Hub, Marketplace feeds, EFADO Nexus feed, and search results so real buyers can call or chat you.',
    example:
      'If you are a farmer with 50 bags of maize or fresh fish to sell, choose "Farmers & Agri-Hub", upload real farm photos, pick Free or Weekly plan, and buyers call you directly.',
    helpCategory: 'General Help'
  },
  skills: {
    id: 'skills',
    title: 'Show Your Skills Guide (EFADOworks & Creator Hub)',
    whatIsThis:
      'Show off your freelance skills, digital work, or creative videos so clients can hire you and pay safely through milestones.',
    steps: [
      'Open "My Profile" in EFADOworks Online (inside Service Corps) to list your skills, bio, rate, and past work links.',
      'Check "Browse Jobs" and submit a clean proposal with your price and delivery time on jobs you can do well.',
      'Clients can also post a job and approve work milestone by milestone so money stays safe until delivery.',
      'In EFADO Nexus, post helpful videos and reels to grow followers and earn from qualified views (₦100 per 1,000 5s+ views).'
    ],
    whatHappensNext:
      'When a client accepts your bid and approves your finished milestone, payment is released to your wallet and you build verified ratings.',
    example:
      'If you are a graphic designer, web builder, or writer, create your skills profile once, bid on matching jobs, deliver on time, and withdraw your pay to your bank.',
    helpCategory: 'General Help'
  },
  serviceCorps: {
    id: 'serviceCorps',
    title: 'Service Corps Guide',
    whatIsThis:
      'Hire trusted local technicians and experts (plumbers, solar installers, builders, tutors, mechanics) or register your trade to get hired.',
    steps: [
      'Need help? Search by skill or browse the 14 service categories, pick a service, and describe what you need.',
      'Agree on a fair price inside the live bargain screen and confirm your location.',
      'Have a trade or skill? Tap "Manifest as Provider" to register your specialty, area, and experience so customers find you.',
      'Switch to the "EFADOworks Online" tab at the top anytime if you offer online remote skills.'
    ],
    whatHappensNext:
      'Your service request or provider registration saves live so customers and technicians can connect, agree on terms, and complete the job.',
    example:
      'If your shop needs a solar inverter fix, search "Solar", request a verified technician in Service Corps, agree on the service fee, and track the job.',
    helpCategory: 'Technical Hub Issues'
  },
  loans: {
    id: 'loans',
    title: 'HepiHands Loan Hub Guide',
    whatIsThis:
      'Check loan offers, apply with verified KYC details, and manage repayments clearly once accredited lenders are active.',
    steps: [
      'Check the status banner first: when accredited lenders are open, review the loan offers, tenor, and interest on the Dashboard.',
      'Tap "Apply for Loan", choose your amount and months, and fill in accurate BVN, NIN, address, and guarantor details.',
      'Wait for accredited lender approval — approved loans are tracked cleanly under "My Loans".',
      'When it is time to pay back, open "Repayment" and settle directly using your EFADO Wallet or Paystack checkout.'
    ],
    whatHappensNext:
      'Every application, repayment schedule, and settled installment updates in your Loan Dashboard so you never lose track of due dates.',
    example:
      'If you run a small shop and need short-term stock support when lenders are open, pick a 3-month plan, submit real KYC info, and pay monthly from your wallet.',
    helpCategory: 'Wallet & Payments'
  },
  cscc: {
    id: 'cscc',
    title: 'CSCC Community Savings Guide',
    whatIsThis:
      'Join or create an Ajo / Esusu collective savings group where members contribute regularly and take turns receiving the bulk payout.',
    steps: [
      'Open "Savings Hub" or "CSCC PLUS" to browse public groups or start a new savings group with clear contribution rules.',
      'Make sure your Account Profile Wallet is funded via Paystack before each contribution cycle is due.',
      'Contribute on your scheduled day inside "Active Arena" to keep your turn position active and verified.',
      'Track your group turns, raffle order, and chat with members in the "Group Feed".'
    ],
    whatHappensNext:
      'When it reaches your payout turn, the pooled cycle funds are credited cleanly so you can withdraw directly to your bank.',
    example:
      'If 10 traders agree to contribute ₦10,000 weekly, each member funds their wallet weekly and takes turns collecting the ₦100,000 bulk payout.',
    helpCategory: 'Wallet & Payments'
  },
  education: {
    id: 'education',
    title: 'Education Hub Guide (JAMB & WAEC)',
    whatIsThis:
      'Prepare for JAMB, WAEC, NECO, and school exams using CBT practice tests, detailed registration guides, AI Tutor, and official WAEC Result e-PINs.',
    steps: [
      'Pick your academic level (JAMB, O’Level/SSCE, Polytechnic, Primary, or Nursery) to open syllabi and CBT practice.',
      'Tap "JAMB Guide" to see NIN/Profile Code steps, course subject combinations, and admission tips.',
      'To check WAEC results, tap "Buy WAEC Scratch Card", enter candidate details, and pay ₦3,500 via Profile Wallet or Paystack.',
      'Need help studying? Tap "Talk to AI Tutor" or join scheduled live seminars inside the Education Hub.'
    ],
    whatHappensNext:
      'Practice CBT results score instantly on screen, and paid WAEC Scratch Card orders generate your serial/PIN record for checking WASSCE or GCE results.',
    example:
      'If you are sitting JAMB or WAEC this year, practice 180-question CBT drills daily for free, and buy your ₦3,500 WAEC PIN right here using your funded EFADO Wallet.',
    helpCategory: 'Live Teaching / Zoom'
  },
  nexus: {
    id: 'nexus',
    title: 'EFADO Nexus (Social & Reels) Guide',
    whatIsThis:
      'Post updates, chat 1-on-1 or in groups, watch or upload short Reels, and earn Creator money when people watch your content.',
    steps: [
      'Tap the feed composer to share text, photos, or helpful posts with the EFADO community.',
      'Open "Direct" or "Groups" at the top to chat privately or join communities like Business, Tech, and Forums.',
      'Upload short videos in Reels Studio — stay active because 5-second+ qualified views earn ₦100 per 1,000 views.',
      'Check your Creator Profile Wallet anytime to withdraw earned creator rewards to your EFADO Wallet or bank.'
    ],
    whatHappensNext:
      'Posts and reels appear live on the feed, qualified views update your Creator Fund automatically, and payouts settle to your account.',
    example:
      'If you teach farming, tech tips, or comedy in 30-second Reels, your 5s+ views count automatically toward real Naira earnings you can cash out.',
    helpCategory: 'General Help'
  },
  domainsPartners: {
    id: 'domainsPartners',
    title: 'Domains & Partners Hub Guide',
    whatIsThis:
      'Register custom domain names, join AI courses, or connect your company/organization as an official EFADO partner or affiliate marketer.',
    steps: [
      'In Domain Hub, use the top tabs to switch between Domains, AI Course, AI Apps, Airtime/Data, or OTC Exchange.',
      'For domains or services, search your name/service, select a plan, and pay directly using your funded Profile Wallet or Paystack.',
      'In Partner Hub, tap "Register My Organization" (with business CAC/contact info) or join the Marketer Center to get referral links.',
      'Check "My Orders" or your partner dashboard anytime to monitor active services and referrals.'
    ],
    whatHappensNext:
      'Every domain purchase, course registration, and partner application saves live for CEO verification and immediate service activation.',
    example:
      'If you run a school or business, register your .com domain in Domain Hub or enroll your organization in Partner Hub so EFADO users can patronize you.',
    helpCategory: 'Technical Hub Issues'
  },
  walletPaystack: {
    id: 'walletPaystack',
    title: 'Wallet & Paystack Guide (Funding & Cash Out)',
    whatIsThis:
      'Your central money hub — fund once via Paystack (Card, Bank Transfer, or USSD) to use every hub, and cash out winnings straight to your bank.',
    steps: [
      'To add money: open "Deposit Funds", enter your amount, pick Paystack Checkout, and pay by Card, Bank Transfer, or USSD.',
      'Your money lands in your Deposit Wallet immediately after Paystack confirms — it automatically powers Games (via Shadow Wallet), VTU, Market, and Education.',
      'To withdraw winnings or earnings: open "My Acc. Profile", save your real 10-digit bank account first, then open "Withdraw Funds".',
      'Enter your payout amount, confirm with your 4-digit PIN, and check "History" for your receipt.'
    ],
    whatHappensNext:
      'Paystack deposits settle through the verified Paystack Settlement Bank right into your EFADO Wallet, and withdrawals transfer straight to your saved bank account.',
    example:
      'If you deposit ₦1,000 using Paystack Bank Transfer, you do not need to deposit again inside Games — just go play, win, and come back here to Cash Out.',
    helpCategory: 'Wallet & Payments'
  },
  ceoPortal: {
    id: 'ceoPortal',
    title: 'CEO Command Portal Guide',
    whatIsThis:
      'Your live executive control room to watch real Paystack bank cash, track profits across all 6 games & every hub, and approve user payouts.',
    steps: [
      'Check the top Dashboard cards: compare "Paystack Settlement Balance" (real cash in Paystack) against the "Internal Firestore Vault" (ledger totals).',
      'Monitor all 6 Game Wallets (Deep Sea Jet, Lucky Spin, Money Card, DMT, Equilibrium, Money Quiz) and see live house profit updated from the server.',
      'Open "All Digital Hubs" and "Transactions" to watch live VTU top-ups, Crypto OTC swaps, Money Exchanges, Marketplace orders, Service Corps, and WAEC PINs.',
      'Open "Cash Out Approvals" to verify and approve user withdrawals, and use "Record Benefit Withdrawal" whenever you settle CEO profits to your bank.'
    ],
    whatHappensNext:
      'Every bet, VTU purchase, exchange, deposit, and withdrawal updates your live dashboards automatically without refreshing the page.',
    example:
      'When a user funds ₦1,000 via Paystack and loses ₦200 playing Equilibrium, Paystack Balance shows your real cash while Total House Gain increases by ₦200 live.',
    helpCategory: 'System Bug / Error'
  }
};
