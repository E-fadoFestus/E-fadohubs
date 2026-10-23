const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const api = express();

// Standard middlewares
api.use(cors({ origin: true }));
api.use(express.json({ limit: '15mb' }));

// Route normalizer: Support both /api/... and direct /... invocation
api.use((req, res, next) => {
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Helper: safe timestamp
const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

// ============================================================================
// 1. SYSTEM HEALTH & DIAGNOSTICS
// ============================================================================
api.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'online',
    system: 'EFADO Ecosystem Unified API',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    totalHubs: 15,
    gateways: ['flutterwave', 'opay', 'paystack']
  });
});

// ============================================================================
// 2. UNIFIED WALLET ENDPOINTS
// ============================================================================
api.get(['/api/wallet/balance', '/api/wallet/balance/:userId'], async (req, res) => {
  try {
    const userId = req.params.userId || req.query.userId || req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const userDoc = await db.collection('users').doc(String(userId)).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }
    const data = userDoc.data() || {};
    return res.json({
      success: true,
      userId,
      playerWallet: data.playerWallet || 0,
      depositWallet: data.depositWallet || 0,
      cashOutWallet: data.cashOutWallet || 0,
      currency: 'NGN'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/wallet/deposit', async (req, res) => {
  try {
    const { userId, amount, paymentMethod = 'flutterwave', reference } = req.body || {};
    if (!userId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'userId and positive amount are required' });
    }
    const txRef = reference || `DEP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txData = {
      userId,
      type: 'deposit',
      amount: Number(amount),
      currency: 'NGN',
      paymentMethod,
      reference: txRef,
      status: 'pending',
      timestamp: serverTimestamp()
    };
    await db.collection('transactions').doc(txRef).set(txData, { merge: true });
    return res.json({ success: true, message: 'Deposit initiated', transaction: txData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 3. FLUTTERWAVE PAYMENT GATEWAY ENDPOINTS
// ============================================================================
api.post(['/api/flutterwave/initialize', '/api/flutterwave/subaccount'], async (req, res) => {
  try {
    const isSubaccount = req.path.includes('subaccount');
    if (isSubaccount) {
      const { account_bank, account_number, business_name } = req.body || {};
      const subId = `FLW_SUB_${Date.now()}`;
      return res.json({
        status: 'success',
        message: 'Subaccount provisioned',
        data: {
          id: subId,
          account_bank,
          account_number,
          business_name: business_name || 'EFADO Vendor',
          split_value: 95
        }
      });
    }

    const { amount, currency = 'NGN', tx_ref } = req.body || {};
    const ref = tx_ref || `FLW-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    return res.json({
      status: 'success',
      data: {
        link: `https://checkout.flutterwave.com/v3/hosted/pay/${ref}`,
        tx_ref: ref,
        amount: Number(amount) || 0,
        currency
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

api.get(['/api/flutterwave/verify/:txRef', '/api/flutterwave/verify'], async (req, res) => {
  const txRef = req.params.txRef || req.query.txRef || req.query.tx_ref;
  return res.json({
    status: 'success',
    data: {
      tx_ref: txRef,
      status: 'successful',
      amount: 1000,
      currency: 'NGN',
      payment_type: 'card'
    }
  });
});

api.get('/api/flutterwave/banks', (req, res) => {
  return res.json({
    status: 'success',
    data: [
      { id: '1', code: '044', name: 'Access Bank' },
      { id: '2', code: '058', name: 'Guaranty Trust Bank (GTBank)' },
      { id: '3', code: '011', name: 'First Bank of Nigeria' },
      { id: '4', code: '033', name: 'United Bank for Africa (UBA)' },
      { id: '5', code: '057', name: 'Zenith Bank' },
      { id: '6', code: '999992', name: 'OPay Digital Services' },
      { id: '7', code: '999991', name: 'PalmPay' },
      { id: '8', code: '050', name: 'Ecobank Nigeria' },
      { id: '9', code: '214', name: 'First City Monument Bank (FCMB)' },
      { id: '10', code: '035', name: 'Wema Bank (ALAT)' }
    ]
  });
});

// ============================================================================
// 4. OPAY PAYMENT GATEWAY ENDPOINTS
// ============================================================================
api.post(['/api/opay/initialize', '/api/opay/init'], async (req, res) => {
  try {
    const { amount, userId } = req.body || {};
    const ref = `OPAY_${Date.now()}_${userId || 'anon'}`;
    const cashierUrl = `https://cashier.opayweb.com/pay/${ref}`;

    if (userId) {
      await db.collection('transactions').doc(`OPAY-${ref}`).set({
        userId,
        type: 'deposit',
        amount: Number(amount) || 0,
        currency: 'NGN',
        status: 'pending',
        paymentGateway: 'opay',
        reference: ref,
        timestamp: serverTimestamp()
      }, { merge: true });
    }

    return res.json({
      status: 'success',
      code: '00000',
      data: {
        cashierUrl,
        reference: ref,
        amount: Number(amount) || 0,
        orderNo: `OPAY_ORD_${Date.now()}`
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

api.get(['/api/opay/status/:reference', '/api/opay/status'], async (req, res) => {
  const reference = req.params.reference || req.query.reference;
  return res.json({
    status: 'success',
    code: '00000',
    data: {
      reference,
      status: 'SUCCESSFUL',
      amount: 1000,
      currency: 'NGN'
    }
  });
});

// ============================================================================
// 5. PAYSTACK & BANK RESOLUTION ENDPOINTS
// ============================================================================
api.post('/api/paystack/initialize', async (req, res) => {
  const { amount, reference } = req.body || {};
  const ref = reference || `PSTK-${Date.now()}`;
  return res.json({
    status: true,
    data: {
      authorization_url: `https://checkout.paystack.com/${ref}`,
      access_code: `code_${Date.now()}`,
      reference: ref,
      amount: Number(amount) || 0
    }
  });
});

api.get(['/api/verify-bank', '/api/bank/resolve'], async (req, res) => {
  const { account_number = '0123456789', bank_code = '044' } = req.query || {};
  return res.json({
    status: true,
    data: {
      account_number,
      account_name: 'EFADO VERIFIED SETTLEMENT ACCOUNT',
      bank_code
    }
  });
});

// ============================================================================
// 6. MASTER HUBS CATALOG (15 HUBS)
// ============================================================================
api.get('/api/hubs', (req, res) => {
  res.json({
    success: true,
    total: 15,
    hubs: [
      { id: '1', slug: 'gaming', name: 'Gaming Arena (DeepSea Jet & Lucky Spin)', route: '/api/hubs/gaming' },
      { id: '2', slug: 'food', name: 'Efado Food & Kitchens', route: '/api/hubs/food' },
      { id: '3', slug: 'transport', name: 'Efado Ride & Logistics', route: '/api/hubs/transport' },
      { id: '4', slug: 'market', name: 'Modern Market & SuperMarket', route: '/api/hubs/market' },
      { id: '5', slug: 'pharma', name: 'Efado Pharmacy & Health', route: '/api/hubs/pharma' },
      { id: '6', slug: 'advertising', name: 'Advertising & Brand Name Hub', route: '/api/hubs/advertising' },
      { id: '7', slug: 'service', name: 'Service Corps & Bargain Platform', route: '/api/hubs/service' },
      { id: '8', slug: 'job', name: 'Job Hub & Freelance Portal', route: '/api/hubs/job' },
      { id: '9', slug: 'community', name: 'Community Hub & Gist Stream', route: '/api/hubs/community' },
      { id: '10', slug: 'loan', name: 'Hepnands Loan & Credit Hub', route: '/api/hubs/loan' },
      { id: '11', slug: 'domain', name: 'Domain & Web Hosting Hub', route: '/api/hubs/domain' },
      { id: '12', slug: 'sourcing', name: 'China Sourcing & Procurement', route: '/api/hubs/sourcing' },
      { id: '13', slug: 'crypto', name: 'Crypto OTC & Exchange Hub', route: '/api/hubs/crypto' },
      { id: '14', slug: 'partner', name: 'Partner Hub & Affiliate Earnings', route: '/api/hubs/partner' },
      { id: '15', slug: 'house-cargo', name: 'House Hub & Bamboo Cargo', route: '/api/hubs/house' }
    ]
  });
});

// Standard previous hubs
api.all('/api/hubs/food', async (req, res) => {
  if (req.method === 'POST') {
    const { userId, orderItems, deliveryAddress, totalAmount } = req.body || {};
    const orderRef = `FOOD-${Date.now()}`;
    await db.collection('market_orders').doc(orderRef).set({
      hub: 'food',
      userId,
      orderItems: orderItems || [],
      deliveryAddress,
      totalAmount: Number(totalAmount) || 0,
      status: 'preparing',
      timestamp: serverTimestamp()
    }, { merge: true });
    return res.json({ success: true, orderId: orderRef, status: 'dispatched_to_kitchen' });
  }
  return res.json({ success: true, category: 'food', menuItems: 24, deliveryTimeMinutes: 30 });
});

api.all('/api/hubs/transport', async (req, res) => {
  if (req.method === 'POST') {
    const bookingId = `RIDE-${Date.now()}`;
    return res.json({ success: true, bookingId, status: 'driver_assigned', etaMinutes: 8 });
  }
  return res.json({ success: true, fleetActive: 48, surgeMultiplier: 1.0 });
});

api.all('/api/hubs/market', async (req, res) => {
  if (req.method === 'POST') {
    const orderId = `MKT-${Date.now()}`;
    return res.json({ success: true, orderId, status: 'payment_verified' });
  }
  return res.json({ success: true, departmentCount: 12, liveVendors: 140 });
});

api.all('/api/hubs/pharma', async (req, res) => {
  if (req.method === 'POST') {
    return res.json({ success: true, rxId: `RX-${Date.now()}`, pharmacistVerified: true });
  }
  return res.json({ success: true, licensedPharmacies: 18, emergencyDelivery: true });
});

api.all(['/api/hubs/telecom', '/api/vtu/order'], async (req, res) => {
  if (req.method === 'POST') {
    const { network, phoneNumber, amount, type = 'AIRTIME' } = req.body || {};
    const vtuRef = `VTU-${Date.now()}`;
    await db.collection('vtu_orders').doc(vtuRef).set({
      network: network || 'MTN',
      phoneNumber: phoneNumber || '08000000000',
      amount: Number(amount) || 100,
      type,
      status: 'completed',
      timestamp: serverTimestamp()
    }, { merge: true });
    return res.json({ success: true, transactionRef: vtuRef, status: 'DELIVERED' });
  }
  return res.json({ success: true, networks: ['MTN', 'AIRTEL', 'GLO', '9MOBILE'], discount: '2.5%' });
});

// ============================================================================
// 7. HUB 1: GAMING ARENA (DeepSea Jet, Lucky Spin, Leaderboard, Bonus)
// Collection: gamingPlays
// ============================================================================
api.post('/api/hubs/gaming/play', async (req, res) => {
  try {
    const { userId, betAmount = 100, targetMultiplier = 2.0, gameType = 'deepsea_jet' } = req.body || {};
    const playId = `GAME-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Crash algorithm simulation
    const crashPoint = Number((1.01 + Math.random() * 4.5).toFixed(2));
    const isWin = crashPoint >= Number(targetMultiplier);
    const winAmount = isWin ? Math.round(Number(betAmount) * Number(targetMultiplier)) : 0;

    const record = {
      playId,
      userId: userId || 'guest',
      betAmount: Number(betAmount),
      targetMultiplier: Number(targetMultiplier),
      crashPoint,
      isWin,
      winAmount,
      gameType,
      createdAt: serverTimestamp()
    };

    await db.collection('gamingPlays').doc(playId).set(record);

    if (userId && isWin && winAmount > 0) {
      await db.collection('users').doc(userId).update({
        playerWallet: admin.firestore.FieldValue.increment(winAmount)
      }).catch(() => {});
    }

    return res.json({ success: true, playId, isWin, crashPoint, winAmount, balanceDelta: isWin ? winAmount : -betAmount });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/gaming/spin', async (req, res) => {
  try {
    const { userId } = req.body || {};
    const rewards = [50, 100, 200, 500, 1000, 2500, 5000, 10000];
    const prize = rewards[Math.floor(Math.random() * rewards.length)];
    const spinId = `SPIN-${Date.now()}`;

    const playData = {
      spinId,
      userId: userId || 'guest',
      gameType: 'lucky_spin',
      prizeWon: prize,
      createdAt: serverTimestamp()
    };

    await db.collection('gamingPlays').doc(spinId).set(playData);

    if (userId) {
      await db.collection('users').doc(userId).update({
        playerWallet: admin.firestore.FieldValue.increment(prize)
      }).catch(() => {});
    }

    return res.json({ success: true, spinId, prize, message: `Congratulations! You won ₦${prize.toLocaleString()}` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.get('/api/hubs/gaming/leaderboard/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const snapshot = await db.collection('gamingPlays')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()
      .catch(() => null);

    const leaders = [];
    if (snapshot && !snapshot.empty) {
      snapshot.forEach(doc => leaders.push({ id: doc.id, ...doc.data() }));
    } else {
      leaders.push(
        { userId: 'Player_Alex', winAmount: 25000, crashPoint: 4.8 },
        { userId: 'Captain_Sam', winAmount: 18500, crashPoint: 3.2 },
        { userId: 'Efado_Star', winAmount: 12000, crashPoint: 2.5 }
      );
    }

    return res.json({
      success: true,
      userId,
      userRank: Math.floor(1 + Math.random() * 20),
      topWinners: leaders
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/gaming/bonus/claim', async (req, res) => {
  try {
    const { userId } = req.body || {};
    const bonusAmount = 500;
    const bonusId = `BONUS-${Date.now()}`;

    await db.collection('gamingPlays').doc(bonusId).set({
      bonusId,
      userId: userId || 'anon',
      gameType: 'daily_bonus',
      amount: bonusAmount,
      claimedAt: serverTimestamp()
    });

    if (userId) {
      await db.collection('users').doc(userId).update({
        playerWallet: admin.firestore.FieldValue.increment(bonusAmount)
      }).catch(() => {});
    }

    return res.json({ success: true, bonusAmount, message: 'Daily gaming bonus claimed successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 8. HUB 2: ADVERTISING + NAME HUB
// Collections: ads, brandNames
// ============================================================================
api.post('/api/hubs/advertising/create', async (req, res) => {
  try {
    const { advertiserId, title, description, targetAudience, budget, imageUrl, link } = req.body || {};
    const adId = `AD-${Date.now()}`;
    const adDoc = {
      adId,
      advertiserId: advertiserId || 'anon',
      title: title || 'EFADO Sponsored Campaign',
      description: description || '',
      targetAudience: targetAudience || 'All Hubs',
      budget: Number(budget) || 5000,
      imageUrl: imageUrl || '',
      link: link || '',
      status: 'active',
      views: 0,
      clicks: 0,
      createdAt: serverTimestamp()
    };
    await db.collection('ads').doc(adId).set(adDoc);
    return res.json({ success: true, adId, message: 'Campaign launched successfully', ad: adDoc });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.get('/api/hubs/advertising/list', async (req, res) => {
  try {
    const snapshot = await db.collection('ads').where('status', '==', 'active').limit(20).get().catch(() => null);
    const ads = [];
    if (snapshot && !snapshot.empty) {
      snapshot.forEach(doc => ads.push({ id: doc.id, ...doc.data() }));
    }
    return res.json({ success: true, count: ads.length, ads });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/name/generate', async (req, res) => {
  try {
    const { industry = 'fintech', keywords = [] } = req.body || {};
    const prefixes = ['Neo', 'Aura', 'Apex', 'Omni', 'Velo', 'Nexus', 'Terra', 'Pulse'];
    const roots = ['Pay', 'Hub', 'Works', 'Flow', 'Grid', 'Core', 'Link', 'Sphere'];
    const generated = [];

    for (let i = 0; i < 5; i++) {
      const p = prefixes[Math.floor(Math.random() * prefixes.length)];
      const r = roots[Math.floor(Math.random() * roots.length)];
      const name = `${p}${r}`;
      generated.push({
        name,
        available: true,
        trademarkRisk: 'low',
        domains: [`${name.toLowerCase()}.com`, `${name.toLowerCase()}.ng`, `${name.toLowerCase()}.com.ng`]
      });
    }

    const docRef = `NAME-GEN-${Date.now()}`;
    await db.collection('brandNames').doc(docRef).set({
      industry,
      keywords,
      suggestions: generated,
      createdAt: serverTimestamp()
    });

    return res.json({ success: true, industry, suggestions: generated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/name/check', async (req, res) => {
  try {
    const { name = '' } = req.body || {};
    const clean = String(name).trim().replace(/[^a-zA-Z0-9]/g, '');
    const isTaken = clean.toLowerCase() === 'efado' || clean.toLowerCase() === 'google';

    const checkDoc = {
      name: clean,
      isAvailable: !isTaken,
      checkedAt: serverTimestamp()
    };
    await db.collection('brandNames').doc(`CHECK-${clean}`).set(checkDoc, { merge: true });

    return res.json({
      success: true,
      name: clean,
      available: !isTaken,
      domainMatches: {
        '.com': !isTaken,
        '.ng': true,
        '.com.ng': true
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 9. HUB 3: SERVICE CORPS + JOB HUB + COMMUNITY HUB
// Collections: serviceRequests, jobPosts, communityPosts
// ============================================================================
api.post('/api/hubs/service/request', async (req, res) => {
  try {
    const { userId, category, title, description, budget, location } = req.body || {};
    const requestId = `SRV-${Date.now()}`;
    const srvData = {
      requestId,
      userId: userId || 'anon',
      category: category || 'Plumbing & Electrical',
      title: title || 'General Maintenance',
      description: description || '',
      budget: Number(budget) || 15000,
      location: location || 'Lagos, Nigeria',
      status: 'pending_dispatch',
      createdAt: serverTimestamp()
    };
    await db.collection('serviceRequests').doc(requestId).set(srvData);
    return res.json({ success: true, requestId, message: 'Service Corps dispatched', service: srvData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.get('/api/hubs/service/providers', async (req, res) => {
  try {
    const providers = [
      { id: '1', name: 'Engr. Festus E.', skill: 'Full-stack & DevOps Specialist', rating: 4.95, jobsCompleted: 142, verified: true },
      { id: '2', name: 'Musa Abdullahi', skill: 'Solar Installation & Inverters', rating: 4.88, jobsCompleted: 88, verified: true },
      { id: '3', name: 'Blessing Okoro', skill: 'Legal & CAC Business Registration', rating: 5.0, jobsCompleted: 210, verified: true },
      { id: '4', name: 'David Adebayo', skill: 'Automotive & Heavy Haulage Logistics', rating: 4.91, jobsCompleted: 76, verified: true }
    ];
    return res.json({ success: true, count: providers.length, providers });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/job/post', async (req, res) => {
  try {
    const { employerId, title, company, salary, location, jobType, description } = req.body || {};
    const jobId = `JOB-${Date.now()}`;
    const jobData = {
      jobId,
      employerId: employerId || 'anon',
      title: title || 'Software Engineer',
      company: company || 'EFADO Merchant Partner',
      salary: salary || '₦250,000 - ₦450,000/mo',
      location: location || 'Remote / Lagos',
      jobType: jobType || 'Full-time',
      description: description || '',
      status: 'open',
      createdAt: serverTimestamp()
    };
    await db.collection('jobPosts').doc(jobId).set(jobData);
    return res.json({ success: true, jobId, message: 'Job posted to EFADO Works network', job: jobData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.get('/api/hubs/job/list', async (req, res) => {
  try {
    const snapshot = await db.collection('jobPosts').where('status', '==', 'open').limit(20).get().catch(() => null);
    const jobs = [];
    if (snapshot && !snapshot.empty) {
      snapshot.forEach(doc => jobs.push({ id: doc.id, ...doc.data() }));
    } else {
      jobs.push(
        { jobId: 'JOB-DEF-1', title: 'React / TypeScript Developer', company: 'EFADO Nexus Lab', salary: '₦400,000/mo', location: 'Remote', jobType: 'Full-time' },
        { jobId: 'JOB-DEF-2', title: 'Dispatch Logistics Captain', company: 'Bamboo Cargo Express', salary: '₦180,000/mo', location: 'Lagos', jobType: 'Full-time' },
        { jobId: 'JOB-DEF-3', title: 'Medical Pharmacy Attendant', company: 'EFADO Health Hub', salary: '₦220,000/mo', location: 'Abuja', jobType: 'Full-time' }
      );
    }
    return res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/community/post', async (req, res) => {
  try {
    const { authorId, authorName, content, mediaUrl, tags } = req.body || {};
    const postId = `COMM-${Date.now()}`;
    const postData = {
      postId,
      authorId: authorId || 'anon',
      authorName: authorName || 'EFADO Member',
      content: content || '',
      mediaUrl: mediaUrl || '',
      tags: tags || ['#EfadoCommunity'],
      likes: 0,
      comments: 0,
      createdAt: serverTimestamp()
    };
    await db.collection('communityPosts').doc(postId).set(postData);
    return res.json({ success: true, postId, message: 'Published to Community Hub', post: postData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.get('/api/hubs/community/feed', async (req, res) => {
  try {
    const snapshot = await db.collection('communityPosts').orderBy('createdAt', 'desc').limit(25).get().catch(() => null);
    const feed = [];
    if (snapshot && !snapshot.empty) {
      snapshot.forEach(doc => feed.push({ id: doc.id, ...doc.data() }));
    } else {
      feed.push(
        { postId: 'COMM-1', authorName: 'Festus E. (CEO)', content: 'Welcome all 15 hubs to the EFADO unified ecosystem! Seamless trade across Nigeria & beyond.', likes: 84, comments: 19 },
        { postId: 'COMM-2', authorName: 'Sarah M.', content: 'Just received my Bamboo Cargo shipment from Guangzhou right on time in Lagos!', likes: 42, comments: 6 }
      );
    }
    return res.json({ success: true, count: feed.length, feed });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 10. HUB 4: HEPNANDS LOAN HUB
// Collection: loanApplications
// ============================================================================
api.post('/api/hubs/loan/apply', async (req, res) => {
  try {
    const { userId, loanAmount, purpose, tenureMonths = 6, monthlyIncome } = req.body || {};
    const loanId = `LOAN-${Date.now()}`;
    const interestRate = 0.045; // 4.5% monthly
    const principal = Number(loanAmount) || 50000;
    const totalRepayable = Math.round(principal * (1 + interestRate * Number(tenureMonths)));

    const loanData = {
      loanId,
      userId: userId || 'anon',
      principal,
      tenureMonths: Number(tenureMonths),
      monthlyIncome: Number(monthlyIncome) || 120000,
      purpose: purpose || 'Working Capital & Inventory',
      interestRate: '4.5%',
      totalRepayable,
      status: 'under_review',
      createdAt: serverTimestamp()
    };

    await db.collection('loanApplications').doc(loanId).set(loanData);
    return res.json({ success: true, loanId, status: 'APPROVED_PRELIMINARY', totalRepayable, loan: loanData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.get('/api/hubs/loan/status/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const snapshot = await db.collection('loanApplications')
      .where('userId', '==', userId)
      .limit(5)
      .get()
      .catch(() => null);

    const loans = [];
    if (snapshot && !snapshot.empty) {
      snapshot.forEach(doc => loans.push({ id: doc.id, ...doc.data() }));
    }

    return res.json({
      success: true,
      userId,
      activeLoans: loans,
      totalOutstanding: loans.reduce((acc, l) => acc + (l.totalRepayable || 0), 0)
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/loan/repay', async (req, res) => {
  try {
    const { userId, loanId, repaymentAmount } = req.body || {};
    const amount = Number(repaymentAmount) || 0;
    const repayRef = `REPAY-${Date.now()}`;

    await db.collection('loanApplications').doc(loanId || 'DEFAULT').set({
      lastRepaymentAmount: amount,
      lastRepaidAt: serverTimestamp(),
      repayReference: repayRef
    }, { merge: true });

    return res.json({ success: true, repayRef, message: `Repayment of ₦${amount.toLocaleString()} confirmed. Credit score updated!` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.get('/api/hubs/loan/eligibility/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    return res.json({
      success: true,
      userId,
      creditScore: 742,
      maxEligibleAmount: 2500000,
      recommendedTenure: '6 - 12 Months',
      rate: '3.8% monthly',
      status: 'ELIGIBLE_FOR_INSTANT_DISBURSEMENT'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 11. HUB 5: DOMAIN HUB + CHINA SOURCING
// Collections: domains, sourcingOrders
// ============================================================================
api.post('/api/hubs/domain/search', async (req, res) => {
  try {
    const { domain = 'myefadobusiness.com' } = req.body || {};
    const clean = String(domain).toLowerCase().trim();
    const tld = clean.includes('.') ? clean.slice(clean.indexOf('.')) : '.com';
    const base = clean.replace(tld, '');

    const options = [
      { domain: `${base}.com`, priceNgn: 15500, available: true },
      { domain: `${base}.ng`, priceNgn: 9500, available: true },
      { domain: `${base}.com.ng`, priceNgn: 3500, available: true },
      { domain: `${base}.store`, priceNgn: 4500, available: true }
    ];

    return res.json({ success: true, searched: clean, results: options });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/domain/buy', async (req, res) => {
  try {
    const { userId, domain, periodYears = 1, registrantName, registrantEmail } = req.body || {};
    const regId = `DOM-REG-${Date.now()}`;
    const domainData = {
      regId,
      userId: userId || 'anon',
      domain: String(domain).toLowerCase(),
      periodYears: Number(periodYears),
      registrantName: registrantName || 'EFADO Customer',
      registrantEmail: registrantEmail || 'customer@efado.com',
      status: 'active',
      nameservers: ['ns1.efadodns.com', 'ns2.efadodns.com'],
      dnsStatus: 'propagated',
      registeredAt: serverTimestamp()
    };
    await db.collection('domains').doc(regId).set(domainData);
    return res.json({ success: true, regId, domain: domainData.domain, status: 'REGISTERED_ACTIVE' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/sourcing/request', async (req, res) => {
  try {
    const { buyerId, productName, targetQuantity, targetPriceUsd, specifications, destinationCity } = req.body || {};
    const sourceId = `SRC-CN-${Date.now()}`;
    const orderData = {
      sourceId,
      buyerId: buyerId || 'anon',
      productName: productName || 'Consumer Electronics',
      targetQuantity: Number(targetQuantity) || 100,
      targetPriceUsd: Number(targetPriceUsd) || 25,
      specifications: specifications || 'Factory inspected Grade A',
      destinationCity: destinationCity || 'Lagos, Nigeria',
      status: 'factory_inspection',
      estimatedArrivalDays: 14,
      createdAt: serverTimestamp()
    };
    await db.collection('sourcingOrders').doc(sourceId).set(orderData);
    return res.json({ success: true, sourceId, message: 'China Procurement Agent Assigned (Guangzhou Office)', order: orderData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.get('/api/hubs/sourcing/track/:id', async (req, res) => {
  try {
    const sourceId = req.params.id;
    const doc = await db.collection('sourcingOrders').doc(sourceId).get().catch(() => null);
    if (doc && doc.exists) {
      return res.json({ success: true, tracking: doc.data() });
    }
    return res.json({
      success: true,
      sourceId,
      status: 'CUSTOMS_CLEARANCE_IN_PROGRESS',
      origin: 'Guangzhou Port, China',
      destination: 'Apapa Port, Lagos, Nigeria',
      milestones: [
        { step: 'Supplier Verified in Yiwu', completed: true },
        { step: 'Quality Control Passed', completed: true },
        { step: 'Air/Sea Cargo Dispatched', completed: true },
        { step: 'Local Delivery Handover', completed: false }
      ]
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 12. HUB 6: CRYPTO OTC + PARTNER HUB
// Collections: cryptoOrders, partnerEarnings
// ============================================================================
api.post('/api/hubs/crypto/otc/order', async (req, res) => {
  try {
    const { userId, type = 'BUY', asset = 'USDT', amountCrypto, amountNgn, walletAddress } = req.body || {};
    const orderId = `OTC-${Date.now()}`;
    const orderData = {
      orderId,
      userId: userId || 'anon',
      type: type.toUpperCase(),
      asset: asset.toUpperCase(),
      amountCrypto: Number(amountCrypto) || 100,
      amountNgn: Number(amountNgn) || 155000,
      walletAddress: walletAddress || '0xEFAD0...WALLET',
      rate: '1550 NGN/USDT',
      status: 'processing',
      escrowLocked: true,
      createdAt: serverTimestamp()
    };
    await db.collection('cryptoOrders').doc(orderId).set(orderData);
    return res.json({ success: true, orderId, message: 'OTC Escrow created', order: orderData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.get('/api/hubs/crypto/rates', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    rates: {
      USDT_NGN: { buy: 1545.0, sell: 1555.0 },
      BTC_NGN: { buy: 104250000, sell: 105800000 },
      ETH_NGN: { buy: 5420000, sell: 5550000 }
    }
  });
});

api.get('/api/hubs/partner/stats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const doc = await db.collection('partnerEarnings').doc(userId).get().catch(() => null);
    const data = doc && doc.exists ? doc.data() : {};
    return res.json({
      success: true,
      userId,
      tier: 'Diamond Master Partner',
      totalEarnedNgn: data.totalEarnedNgn || 845000,
      pendingPayoutNgn: data.pendingPayoutNgn || 125000,
      totalReferrals: data.totalReferrals || 342,
      commissionRate: '15%'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/partner/withdraw', async (req, res) => {
  try {
    const { userId, amount, destinationBank, destinationAccount } = req.body || {};
    const withdrawId = `PARTNER-WD-${Date.now()}`;
    await db.collection('partnerEarnings').doc(userId || 'anon').set({
      lastWithdrawalAmount: Number(amount) || 0,
      lastWithdrawalAt: serverTimestamp(),
      destinationBank: destinationBank || 'Access Bank',
      destinationAccount: destinationAccount || '0123456789',
      status: 'processing_settlement'
    }, { merge: true });

    return res.json({ success: true, withdrawId, message: 'Affiliate commission withdrawal initiated to your verified bank account.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 13. HUB 7: HOUSE HUB + CARGO (Bamboo Cargo)
// Collections: houseListings, cargoShipments
// ============================================================================
api.post('/api/hubs/house/list', async (req, res) => {
  try {
    const { landlordId, title, propertyType, pricePerYear, location, bedrooms, photos } = req.body || {};
    const houseId = `HOUSE-${Date.now()}`;
    const listing = {
      houseId,
      landlordId: landlordId || 'anon',
      title: title || 'Modern 3 Bedroom Serviced Apartment',
      propertyType: propertyType || 'Apartment / Flat',
      pricePerYear: Number(pricePerYear) || 2500000,
      location: location || 'Lekki Phase 1, Lagos',
      bedrooms: Number(bedrooms) || 3,
      photos: photos || ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600'],
      status: 'active_inspection_ready',
      verifiedByEfado: true,
      createdAt: serverTimestamp()
    };
    await db.collection('houseListings').doc(houseId).set(listing);
    return res.json({ success: true, houseId, message: 'Property verified and published to House Hub', listing });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

api.post('/api/hubs/cargo/ship', async (req, res) => {
  try {
    const { senderId, recipientName, recipientPhone, origin, destination, cargoWeightKg, packageType } = req.body || {};
    const trackingNumber = `BMC-${Date.now()}`;
    const weight = Number(cargoWeightKg) || 10;
    const ratePerKg = 4500;
    const shippingFee = weight * ratePerKg;

    const shipmentData = {
      trackingNumber,
      carrier: 'Bamboo Cargo Express',
      senderId: senderId || 'anon',
      recipientName: recipientName || 'EFADO Consignee',
      recipientPhone: recipientPhone || '+2348000000000',
      origin: origin || 'Guangzhou / Yiwu, China',
      destination: destination || 'Lagos, Nigeria',
      cargoWeightKg: weight,
      packageType: packageType || 'Electronics / Fragile Goods',
      shippingFee,
      currency: 'NGN',
      status: 'waybill_issued',
      etaDays: 5,
      createdAt: serverTimestamp()
    };
    await db.collection('cargoShipments').doc(trackingNumber).set(shipmentData);
    return res.json({ success: true, trackingNumber, shippingFee, message: 'Bamboo Cargo Waybill Generated', shipment: shipmentData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 14. GAME ENGINE ENDPOINTS (/api/game/* and /game/*)
// ============================================================================
const activeGameRounds = new Map();

function generateProvablyFairCrash(serverSeed, clientSeed, nonce) {
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
  const hs = parseInt(hash.slice(0, 8), 16);
  if (hs % 33 === 0) return 1.00;
  const h = parseInt(hash.slice(0, 13), 16);
  const e = Math.pow(2, 52);
  const result = Math.floor((100 * e - h) / (e - h)) / 100;
  return Math.max(1.01, Math.min(100.0, Number(result.toFixed(2))));
}

const handleGameStart = (req, res) => {
  const crypto = require('crypto');
  const clientSeed = req.body?.clientSeed || 'efado-client-' + Math.random().toString(36).slice(2, 10);
  const nonce = req.body?.nonce || Math.floor(Math.random() * 1000);
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
  const crashMultiplier = generateProvablyFairCrash(serverSeed, clientSeed, nonce);

  const round = {
    roundId: `dsj-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce,
    crashMultiplier,
    startTime: Date.now(),
    status: 'flying'
  };
  activeGameRounds.set(round.roundId, round);

  return res.json({
    success: true,
    roundId: round.roundId,
    serverSeedHash: round.serverSeedHash,
    clientSeed: round.clientSeed,
    nonce: round.nonce,
    crashMultiplier: round.crashMultiplier,
    startTime: round.startTime
  });
};

api.post(['/api/game/start', '/game/start'], handleGameStart);

api.post(['/api/game/bet', '/game/bet'], async (req, res) => {
  let { userId, betAmount, currency, consoleId, isAutoCashout, autoCashoutMultiplier } = req.body || {};
  betAmount = Number(betAmount) || 100;
  if (betAmount < 100) betAmount = 100;
  if (betAmount > 20000) betAmount = 20000;

  const betData = {
    betId: `bet-${Date.now()}-${consoleId || 1}`,
    userId: userId || 'anon',
    betAmount,
    currency: currency || 'NGN',
    consoleId: consoleId || 1,
    status: 'placed',
    isAutoCashout: !!isAutoCashout,
    autoCashoutMultiplier: autoCashoutMultiplier || 2.0,
    createdAt: serverTimestamp()
  };

  db.collection('gamingPlays').doc(betData.betId).set(betData).catch(() => {});

  return res.json({
    success: true,
    betId: betData.betId,
    betAmount,
    currency: betData.currency,
    consoleId: betData.consoleId,
    status: 'placed',
    isAutoCashout: betData.isAutoCashout,
    autoCashoutMultiplier: betData.autoCashoutMultiplier
  });
});

api.post(['/api/game/cashout', '/game/cashout'], async (req, res) => {
  const { userId, betAmount, multiplier, consoleId } = req.body || {};
  const mult = Number(multiplier) || 1.0;
  const stake = Math.min(20000, Math.max(100, Number(betAmount) || 100));
  const rawWin = stake * mult;
  const winPayout = Math.min(500000, Number(rawWin.toFixed(2)));
  const profit = Number((winPayout - stake).toFixed(2));

  if (userId) {
    db.collection('users').doc(userId).update({
      playerWallet: admin.firestore.FieldValue.increment(winPayout)
    }).catch(() => {});
  }

  return res.json({
    success: true,
    winPayout,
    multiplier: mult,
    profit,
    isMaxWinCapped: rawWin > 500000,
    status: 'cashed_out',
    consoleId: consoleId || 1
  });
});

api.post(['/api/game/crash', '/game/crash'], (req, res) => {
  const { roundId, crashMultiplier } = req.body || {};
  return res.json({
    success: true,
    roundId: roundId || `dsj-${Date.now()}`,
    crashMultiplier: Number(crashMultiplier) || 2.5,
    timestamp: Date.now()
  });
});

// ============================================================================
// 15. EFADO NEXUS HUB & CHAT APIS
// ============================================================================
const buzzCooldowns = new Map();
const uploadedFilesStore = new Map();

api.post('/api/deep-link/create', (req, res) => {
  const { type = 'gist', id = 'general', title = 'EFADO Nexus' } = req.body || {};
  const webFallback = `https://e-fado.com/nexus-hub?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
  return res.json({
    success: true,
    deepLink: `efado-nexus.com/${type}/${id}`,
    webUrl: webFallback,
    dynamicLink: `https://efadonexus.page.link/?link=${encodeURIComponent(webFallback)}`,
    type,
    id,
    title
  });
});

api.post('/api/share/generate', (req, res) => {
  const { title = 'EFADO NEXUS HUB', text = '', url = 'https://efado-nexus.com/hub' } = req.body || {};
  const fullShareText = `${title}\n${text ? text + '\n' : ''}Explore on EFADO NEXUS HUB: ${url}`;
  return res.json({
    success: true,
    sharePayload: {
      title,
      text: fullShareText,
      url,
      whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`,
      facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitterUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}`,
      telegramUrl: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(fullShareText)}`
    }
  });
});

api.post('/api/users/add', (req, res) => {
  const { username, phone, email, roomId = 'general', groupName = 'Nexus Circle' } = req.body || {};
  const targetIdentifier = username || phone || email || 'Colleague';
  return res.json({
    success: true,
    message: `User ${targetIdentifier} successfully added to ${groupName}!`,
    user: {
      username: targetIdentifier,
      roomId,
      inviteLink: `https://efado-nexus.com/user/${encodeURIComponent(targetIdentifier)}?room=${encodeURIComponent(roomId)}`
    }
  });
});

api.post('/api/upload', (req, res) => {
  const { fileName = 'file_' + Date.now(), fileSize = 1024 * 1024 * 3.2, mimeType = 'application/octet-stream' } = req.body || {};
  const fileId = 'nexus_file_' + Date.now();
  const fileRecord = {
    fileId,
    fileName,
    fileSize,
    formattedSize: `${(fileSize / (1024 * 1024)).toFixed(1)} MB`,
    mimeType,
    uploadedAt: Date.now(),
    downloadUrl: `/api/download/${fileId}`
  };
  uploadedFilesStore.set(fileId, fileRecord);
  return res.json({ success: true, file: fileRecord, message: `Successfully uploaded ${fileName}` });
});

api.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const file = uploadedFilesStore.get(id) || {
    fileId: id,
    fileName: `EFADO_Document_${id.substring(0, 6)}.pdf`,
    formattedSize: '3.2 MB',
    fileSize: 3355443,
    mimeType: 'application/pdf',
    savedFolder: 'EFADO_Nexus_Downloads'
  };
  return res.json({ success: true, ...file, timestamp: Date.now() });
});

api.post('/api/chat/buzz', (req, res) => {
  const { fromUser = 'Alex', toUser = 'Peer' } = req.body || {};
  const key = `${fromUser}:${toUser}`;
  const now = Date.now();
  const lastBuzzed = buzzCooldowns.get(key) || 0;
  const COOLDOWN_MS = 30 * 1000;

  if (now - lastBuzzed < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - lastBuzzed)) / 1000);
    return res.status(429).json({ success: false, cooldownRemaining: wait, message: `Please wait ${wait}s` });
  }

  buzzCooldowns.set(key, now);
  return res.json({
    success: true,
    cooldown: 30,
    buzzedAt: now,
    alertText: `${fromUser} buzzed you • just now`
  });
});

api.post('/api/chat/screenshot', (req, res) => {
  const { timestamp = Date.now() } = req.body || {};
  return res.json({
    success: true,
    screenshotId: 'nexus_shot_' + Date.now(),
    watermark: 'EFADO NEXUS HUB',
    timestamp,
    message: 'Screenshot captured'
  });
});

api.post('/api/call/video', (req, res) => {
  const { roomId = 'room_1' } = req.body || {};
  return res.json({
    success: true,
    callId: 'call_vid_' + Date.now(),
    roomId,
    type: 'video',
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });
});

api.post('/api/call/voice', (req, res) => {
  const { roomId = 'room_1', voiceMask = 'Normal' } = req.body || {};
  return res.json({
    success: true,
    callId: 'call_aud_' + Date.now(),
    roomId,
    type: 'voice',
    voiceMask
  });
});

api.post('/api/status/create', (req, res) => {
  const { userId = 'usr_1', userName = 'User', caption = '', isAdvert = false, adTag = 'AD' } = req.body || {};
  const statusId = 'status_' + Date.now();
  return res.json({
    success: true,
    status: {
      id: statusId,
      userId,
      userName,
      caption,
      isAdvert,
      adTag: isAdvert ? adTag : null,
      createdAt: Date.now()
    }
  });
});

api.post('/api/reels/create', (req, res) => {
  const { userId = 'usr_1', caption = '', duration = 60 } = req.body || {};
  return res.json({
    success: true,
    reel: {
      id: 'reel_' + Date.now(),
      userId,
      caption,
      duration,
      createdAt: Date.now()
    }
  });
});

api.post('/api/chat/translate', (req, res) => {
  const { text = '', targetLanguage = 'pidgin' } = req.body || {};
  return res.json({
    success: true,
    originalText: text,
    targetLanguage,
    translatedText: text ? `[${targetLanguage.toUpperCase()}]: ${text}` : ''
  });
});

// ============================================================================
// 16. CENTRALIZED AI CORE SERVICES
// ============================================================================
api.post('/api/ai/generate-image', (req, res) => {
  const { prompt = 'EFADO Modern Commerce' } = req.body || {};
  const seed = encodeURIComponent(String(prompt).trim().slice(0, 30));
  return res.json({
    success: true,
    imageUrl: `https://picsum.photos/seed/${seed}/800/800`,
    prompt
  });
});

api.post('/api/ai/edit-image', (req, res) => {
  const { prompt = '', image } = req.body || {};
  return res.json({
    success: true,
    imageUrl: image || 'https://picsum.photos/seed/edited/800/800',
    prompt
  });
});

api.post('/api/ai/search-grounding', (req, res) => {
  const { query = 'EFADO market' } = req.body || {};
  return res.json({
    success: true,
    query,
    text: `Verified live data for ${query}. EFADO multi-hub network connects verified merchants across Nigeria and Africa.`,
    sources: [{ title: 'EFADO Ecosystem Directory', url: 'https://e-fado.com' }]
  });
});

api.post('/api/ai/voice-chat', (req, res) => {
  const { message = 'Hello' } = req.body || {};
  return res.json({
    success: true,
    text: `Hello! I am EFADO AI Assistant. You asked: "${message}". How can I support your trade, logistics, or examination preparation today?`
  });
});

api.post('/api/ai/animate-video', (req, res) => {
  return res.json({
    success: false,
    locked: true,
    message: 'Veo 3 video generation is locked in production to prevent unexpected billing. Upgrade tier available in Account Settings.'
  });
});

// ============================================================================
// 17. CHUNKED REEL UPLOADS & STREAMING (/api/uploadReelChunk & /uploadReelChunk)
// ============================================================================
const apiReelSessions = new Map();

api.post(['/api/uploadReelChunk', '/uploadReelChunk'], (req, res) => {
  try {
    const {
      uploadId,
      chunkIndex,
      totalChunks,
      chunkData,
      chunk,
      fileName = 'reel.mp4',
      mimeType = 'video/mp4',
      userId = 'user',
      caption = ''
    } = req.body || {};

    const rawChunk = chunkData || chunk;

    if (!uploadId || chunkIndex === undefined || !totalChunks || !rawChunk) {
      return res.status(400).json({
        success: false,
        error: 'Missing required chunk fields: uploadId, chunkIndex, totalChunks, chunkData'
      });
    }

    let session = apiReelSessions.get(uploadId);
    if (!session) {
      session = {
        uploadId,
        fileName,
        mimeType,
        totalChunks: Number(totalChunks),
        chunks: new Array(Number(totalChunks)),
        receivedCount: 0,
        createdAt: Date.now(),
        userId,
        caption
      };
      apiReelSessions.set(uploadId, session);
    }

    const cleanBase64 = String(rawChunk).replace(/^data:[^;]+;base64,/, '');
    const chunkBuffer = Buffer.from(cleanBase64, 'base64');
    const idx = Number(chunkIndex);

    if (!session.chunks[idx]) {
      session.chunks[idx] = chunkBuffer;
      session.receivedCount++;
    }

    const progress = Math.min(100, Math.round((session.receivedCount / session.totalChunks) * 100));

    if (session.receivedCount >= session.totalChunks) {
      const fullBuffer = Buffer.concat(session.chunks);
      const reelId = `reel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      session.fullBuffer = fullBuffer;
      session.completed = true;
      session.completedAt = Date.now();
      session.reelId = reelId;
      session.chunks = null; // free memory

      // Also create a Firestore reel entry
      db.collection('reels').doc(reelId).set({
        id: reelId,
        authorId: userId,
        caption,
        videoUrl: `/api/reels/stream/${uploadId}`,
        createdAt: serverTimestamp(),
        likes: [],
        comments: [],
        shares: 0,
        tags: ['#Viral', '#EFADO', '#Reels']
      }).catch(() => {});

      setTimeout(() => {
        apiReelSessions.delete(uploadId);
      }, 2 * 60 * 60 * 1000);

      return res.status(200).json({
        success: true,
        completed: true,
        progress: 100,
        uploadId,
        reelId,
        videoUrl: `/api/reels/stream/${uploadId}`,
        sizeBytes: fullBuffer.length,
        formattedSize: `${(fullBuffer.length / (1024 * 1024)).toFixed(2)} MB`,
        message: 'Reel successfully reassembled and ready for streaming'
      });
    }

    return res.status(200).json({
      success: true,
      completed: false,
      progress,
      chunkIndex: idx,
      totalChunks: session.totalChunks,
      receivedCount: session.receivedCount,
      message: `Chunk ${idx + 1} of ${session.totalChunks} received (${progress}%)`
    });
  } catch (err) {
    console.error('[api/uploadReelChunk] Error processing chunk:', err);
    return res.status(500).json({ success: false, error: err.message || 'Chunk processing failed' });
  }
});

api.get(['/api/reels/stream/:uploadId', '/reels/stream/:uploadId'], (req, res) => {
  const { uploadId } = req.params;
  const session = apiReelSessions.get(uploadId);

  if (!session || !session.fullBuffer) {
    return res.status(404).json({ success: false, error: 'Reel stream not found or expired' });
  }

  const videoBuffer = session.fullBuffer;
  const videoSize = videoBuffer.length;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;
    const chunksize = (end - start) + 1;
    const head = {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': session.mimeType || 'video/mp4',
      'Access-Control-Allow-Origin': '*'
    };
    res.writeHead(206, head);
    res.end(videoBuffer.subarray(start, end + 1));
  } else {
    const head = {
      'Content-Length': videoSize,
      'Content-Type': session.mimeType || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*'
    };
    res.writeHead(200, head);
    res.end(videoBuffer);
  }
});

module.exports = api;
