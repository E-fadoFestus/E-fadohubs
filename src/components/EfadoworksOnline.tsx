import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  User, 
  Wallet, 
  Send, 
  Star, 
  Plus, 
  X, 
  Check, 
  Clock, 
  Shield, 
  Filter, 
  FileText, 
  ChevronRight, 
  AlertCircle, 
  Bell, 
  Award, 
  Search, 
  ArrowLeft,
  DollarSign,
  Layers,
  ThumbsUp,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { 
  db, 
  collection, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  serverTimestamp,
  runTransaction
} from '../firebase';
import { UserProfile } from '../types';
import efadoworksBg from '../assets/images/efadoworks_bg_1782484273255.jpg';

interface EfadoworksOnlineProps {
  user: UserProfile;
}

export interface FreelancerProfile {
  userId: string;
  displayName: string;
  title: string;
  bio: string;
  skills: string[];
  hourlyRate: number;
  portfolioLinks: string[];
  rating: number;
  totalJobsCompleted: number;
  availability: 'Available' | 'Busy' | 'Not Available';
  memberSince: string;
}

export interface ClientProfile {
  userId: string;
  companyName: string;
  totalJobsPosted: number;
  totalSpent: number;
  rating: number;
}

export interface FreelanceJob {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budgetType: 'Fixed' | 'Hourly';
  budgetMin: number;
  budgetMax: number;
  duration: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: any;
  updatedAt: any;
  bidsCount?: number;
}

export interface FreelanceBid {
  id: string;
  jobId: string;
  jobTitle?: string;
  freelancerId: string;
  freelancerName: string;
  freelancerTitle?: string;
  freelancerRating?: number;
  coverLetter: string;
  bidAmount: number;
  estimatedDuration: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';
  createdAt: any;
}

export interface FreelanceContract {
  id: string;
  jobId: string;
  jobTitle: string;
  freelancerId: string;
  freelancerName: string;
  clientId: string;
  clientName: string;
  agreedAmount: number;
  status: 'Active' | 'Completed' | 'Disputed' | 'Cancelled';
  startedAt: any;
  completedAt?: any;
}

export interface FreelanceMilestone {
  id: string;
  contractId: string;
  title: string;
  amount: number;
  status: 'Pending' | 'In Progress' | 'Delivered' | 'Approved' | 'Paid';
  dueDate: string;
  deliverableDescription?: string;
  deliverableFile?: string;
}

export interface FreelanceReview {
  id: string;
  contractId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  roleOfReviewer: 'Client' | 'Freelancer';
  rating: number;
  comment: string;
  createdAt: any;
}

export interface FreelanceNotification {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: any;
}

export const EfadoworksOnline: React.FC<EfadoworksOnlineProps> = ({ user }) => {
  // User Profile States
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Core App UI States
  const [activeRole, setActiveRole] = useState<'CLIENT' | 'FREELANCER' | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Data Collections States
  const [jobs, setJobs] = useState<FreelanceJob[]>([]);
  const [myBids, setMyBids] = useState<FreelanceBid[]>([]);
  const [myJobs, setMyJobs] = useState<FreelanceJob[]>([]);
  const [myContracts, setMyContracts] = useState<FreelanceContract[]>([]);
  const [selectedJob, setSelectedJob] = useState<FreelanceJob | null>(null);
  const [jobBids, setJobBids] = useState<FreelanceBid[]>([]);
  const [selectedContract, setSelectedContract] = useState<FreelanceContract | null>(null);
  const [contractMilestones, setContractMilestones] = useState<FreelanceMilestone[]>([]);
  const [notifications, setNotifications] = useState<FreelanceNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Forms States
  const [showFreelancerOnboard, setShowFreelancerOnboard] = useState(false);
  const [showClientOnboard, setShowClientOnboard] = useState(false);
  
  // Onboard Forms Fields
  const [flTitle, setFlTitle] = useState('');
  const [flBio, setFlBio] = useState('');
  const [flHourlyRate, setFlHourlyRate] = useState(25);
  const [flSkills, setFlSkills] = useState('');
  const [flPortfolio, setFlPortfolio] = useState('');
  
  const [clCompanyName, setClCompanyName] = useState('');

  // Post Job Fields
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobCat, setJobCat] = useState('Software Development');
  const [jobSkillsRequired, setJobSkillsRequired] = useState('');
  const [jobBudgetType, setJobBudgetType] = useState<'Fixed' | 'Hourly'>('Fixed');
  const [jobBudgetMin, setJobBudgetMin] = useState(100);
  const [jobBudgetMax, setJobBudgetMax] = useState(500);
  const [jobDuration, setJobDuration] = useState('1-3 Months');

  // Submit Proposal Fields
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalCover, setProposalCover] = useState('');
  const [proposalAmount, setProposalAmount] = useState(100);
  const [proposalDuration, setProposalDuration] = useState('1 Week');

  // Milestone Creation Fields
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msAmount, setMsAmount] = useState(100);
  const [msDueDate, setMsDueDate] = useState('');

  // Submit Deliverable Fields
  const [showDeliverableForm, setShowDeliverableForm] = useState(false);
  const [deliverableText, setDeliverableText] = useState('');
  const [deliverableLink, setDeliverableLink] = useState('');
  const [activeMilestoneId, setActiveMilestoneId] = useState('');

  // Leave Review Fields
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Standard marketplace categories
  const categories = [
    'All',
    'Software Development',
    'Creative & UI/UX Design',
    'Writing & Translation',
    'Marketing & Strategy',
    'Business & Admin Support',
    'Engineering & Consultancy',
    'AI & Data Science'
  ];

  // Helper: Display floating notifications
  const triggerNotification = (message: string, isSuccess = true) => {
    if (isSuccess) {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 5000);
    } else {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  // Helper: Create internal in-app notifications
  const createNotification = async (userId: string, type: string, msg: string) => {
    try {
      const notifCol = collection(db, 'efado_notifications');
      await addDoc(notifCol, {
        userId,
        type,
        message: msg,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Error creating notification:', e);
    }
  };

  // 1. Listen for profiles
  useEffect(() => {
    if (!user?.uid) return;

    setLoadingProfile(true);

    const unsubFl = onSnapshot(doc(db, 'efado_freelancers', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setFreelancerProfile(docSnap.data() as FreelancerProfile);
      } else {
        setFreelancerProfile(null);
      }
    }, (err) => console.error('Freelancer Profile listen error:', err));

    const unsubCl = onSnapshot(doc(db, 'efado_clients', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setClientProfile(docSnap.data() as ClientProfile);
      } else {
        setClientProfile(null);
      }
      setLoadingProfile(false);
    }, (err) => {
      console.error('Client Profile listen error:', err);
      setLoadingProfile(false);
    });

    // Sub to user's notifications
    const qNotif = query(
      collection(db, 'efado_notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubNotif = onSnapshot(qNotif, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as FreelanceNotification)));
    }, (err) => console.warn('Notifications sub disabled or rules pending:', err));

    return () => {
      unsubFl();
      unsubCl();
      unsubNotif();
    };
  }, [user?.uid]);

  // Set default role once profiles load
  useEffect(() => {
    if (!loadingProfile) {
      if (freelancerProfile) {
        setActiveRole('FREELANCER');
      } else if (clientProfile) {
        setActiveRole('CLIENT');
      } else {
        setActiveRole(null);
      }
    }
  }, [loadingProfile, freelancerProfile, clientProfile]);

  // 2. Fetch jobs, bids, and contracts
  useEffect(() => {
    if (!user?.uid) return;

    // Stream jobs
    const qJobs = query(collection(db, 'efado_jobs'), orderBy('createdAt', 'desc'));
    const unsubJobs = onSnapshot(qJobs, (snap) => {
      const loadedJobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as FreelanceJob));
      setJobs(loadedJobs);
    }, (err) => console.error('Jobs stream error:', err));

    // Stream freelancer bids if role is freelancer
    const qMyBids = query(collection(db, 'efado_bids'), where('freelancerId', '==', user.uid));
    const unsubMyBids = onSnapshot(qMyBids, (snap) => {
      setMyBids(snap.docs.map(d => ({ id: d.id, ...d.data() } as FreelanceBid)));
    }, (err) => console.warn('Bids stream pending rules:', err));

    // Stream contracts
    const qContracts = query(
      collection(db, 'efado_contracts'),
      where(activeRole === 'CLIENT' ? 'clientId' : 'freelancerId', '==', user.uid)
    );
    const unsubContracts = onSnapshot(qContracts, (snap) => {
      setMyContracts(snap.docs.map(d => ({ id: d.id, ...d.data() } as FreelanceContract)));
    }, (err) => console.warn('Contracts stream pending:', err));

    return () => {
      unsubJobs();
      unsubMyBids();
      unsubContracts();
    };
  }, [user?.uid, activeRole]);

  // 3. Listen for selected job's bids
  useEffect(() => {
    if (!selectedJob) {
      setJobBids([]);
      return;
    }
    const qBids = query(collection(db, 'efado_bids'), where('jobId', '==', selectedJob.id));
    const unsubBids = onSnapshot(qBids, (snap) => {
      setJobBids(snap.docs.map(d => ({ id: d.id, ...d.data() } as FreelanceBid)));
    }, (err) => console.warn('Job bids query error:', err));

    return () => unsubBids();
  }, [selectedJob]);

  // 4. Listen for selected contract's milestones
  useEffect(() => {
    if (!selectedContract) {
      setContractMilestones([]);
      return;
    }
    const qMilestones = query(
      collection(db, 'efado_milestones'),
      where('contractId', '==', selectedContract.id)
    );
    const unsubMilestones = onSnapshot(qMilestones, (snap) => {
      setContractMilestones(snap.docs.map(d => ({ id: d.id, ...d.data() } as FreelanceMilestone)));
    }, (err) => console.warn('Milestones query error:', err));

    return () => unsubMilestones();
  }, [selectedContract]);

  // Onboard Handlers
  const handleOnboardFreelancer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flTitle || !flBio || !flSkills) {
      triggerNotification('Please fill in all fields', false);
      return;
    }
    try {
      const flData: FreelancerProfile = {
        userId: user.uid,
        displayName: user.displayName || user.email.split('@')[0],
        title: flTitle,
        bio: flBio,
        skills: flSkills.split(',').map(s => s.trim()).filter(Boolean),
        hourlyRate: Number(flHourlyRate),
        portfolioLinks: flPortfolio ? flPortfolio.split(',').map(s => s.trim()).filter(Boolean) : [],
        rating: 5,
        totalJobsCompleted: 0,
        availability: 'Available',
        memberSince: new Date().toISOString()
      };
      await setDoc(doc(db, 'efado_freelancers', user.uid), flData);
      setFreelancerProfile(flData);
      setShowFreelancerOnboard(false);
      setActiveRole('FREELANCER');
      triggerNotification('Freelancer profile created successfully!');
    } catch (err: any) {
      triggerNotification(err.message, false);
    }
  };

  const handleOnboardClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clCompanyName) {
      triggerNotification('Please specify a Client or Company Name', false);
      return;
    }
    try {
      const clData: ClientProfile = {
        userId: user.uid,
        companyName: clCompanyName,
        totalJobsPosted: 0,
        totalSpent: 0,
        rating: 5
      };
      await setDoc(doc(db, 'efado_clients', user.uid), clData);
      setClientProfile(clData);
      setShowClientOnboard(false);
      setActiveRole('CLIENT');
      triggerNotification('Client profile created successfully!');
    } catch (err: any) {
      triggerNotification(err.message, false);
    }
  };

  // Job Posting Handler
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobDesc || !jobSkillsRequired) {
      triggerNotification('Please fill in all job requirements', false);
      return;
    }
    try {
      const jobCol = collection(db, 'efado_jobs');
      const docRef = doc(jobCol);
      const newJob: FreelanceJob = {
        id: docRef.id,
        clientId: user.uid,
        clientName: clientProfile?.companyName || user.displayName || 'Authorized Client',
        title: jobTitle,
        description: jobDesc,
        category: jobCat,
        skills: jobSkillsRequired.split(',').map(s => s.trim()).filter(Boolean),
        budgetType: jobBudgetType,
        budgetMin: Number(jobBudgetMin),
        budgetMax: Number(jobBudgetMax),
        duration: jobDuration,
        status: 'Open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, newJob);

      // Increment totalJobsPosted
      if (clientProfile) {
        await updateDoc(doc(db, 'efado_clients', user.uid), {
          totalJobsPosted: (clientProfile.totalJobsPosted || 0) + 1
        });
      }

      setJobTitle('');
      setJobDesc('');
      setJobSkillsRequired('');
      setCurrentTab('manage-jobs');
      triggerNotification('Freelance job posted successfully!');
    } catch (err: any) {
      triggerNotification(err.message, false);
    }
  };

  // Submit Bid/Proposal Handler
  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    if (!proposalCover) {
      triggerNotification('Please write a cover letter summarizing your approach', false);
      return;
    }
    try {
      const bidCol = collection(db, 'efado_bids');
      const bidRef = doc(bidCol);
      const newBid: FreelanceBid = {
        id: bidRef.id,
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        freelancerId: user.uid,
        freelancerName: freelancerProfile?.displayName || user.displayName || 'Tactical Freelancer',
        freelancerTitle: freelancerProfile?.title || 'Expert Agent',
        freelancerRating: freelancerProfile?.rating || 5,
        coverLetter: proposalCover,
        bidAmount: Number(proposalAmount),
        estimatedDuration: proposalDuration,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      await setDoc(bidRef, newBid);

      // Notify Client
      await createNotification(
        selectedJob.clientId,
        'new_bid',
        `New proposal received on "${selectedJob.title}" for $${proposalAmount} from ${newBid.freelancerName}`
      );

      setProposalCover('');
      setShowProposalForm(false);
      triggerNotification('Proposal submitted successfully!');
    } catch (err: any) {
      triggerNotification(err.message, false);
    }
  };

  // Hire & Start Contract Flow
  const handleHireFreelancer = async (bid: FreelanceBid) => {
    if (!selectedJob) return;
    try {
      // Create Contract
      const contractCol = collection(db, 'efado_contracts');
      const contractRef = doc(contractCol);
      
      const newContract: FreelanceContract = {
        id: contractRef.id,
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        freelancerId: bid.freelancerId,
        freelancerName: bid.freelancerName,
        clientId: user.uid,
        clientName: clientProfile?.companyName || 'Premium Client',
        agreedAmount: bid.bidAmount,
        status: 'Active',
        startedAt: new Date().toISOString()
      };
      
      await setDoc(contractRef, newContract);

      // Create a default 100% milestone
      const milestoneCol = collection(db, 'efado_milestones');
      const msRef = doc(milestoneCol);
      const firstMilestone: FreelanceMilestone = {
        id: msRef.id,
        contractId: contractRef.id,
        title: 'Project Completion Deliverable',
        amount: bid.bidAmount,
        status: 'In Progress',
        dueDate: 'Flexible'
      };
      await setDoc(msRef, firstMilestone);

      // Update Job Status
      await updateDoc(doc(db, 'efado_jobs', selectedJob.id), {
        status: 'In Progress',
        updatedAt: new Date().toISOString()
      });

      // Update Bid Status
      await updateDoc(doc(db, 'efado_bids', bid.id), {
        status: 'Accepted'
      });

      // Reject all other bids
      const otherBids = jobBids.filter(b => b.id !== bid.id);
      for (const ob of otherBids) {
        await updateDoc(doc(db, 'efado_bids', ob.id), {
          status: 'Rejected'
        });
      }

      // Notify Freelancer
      await createNotification(
        bid.freelancerId,
        'bid_accepted',
        `Congratulations! Your bid on "${selectedJob.title}" was accepted. Contract is now active.`
      );

      setSelectedJob(null);
      setSelectedContract(newContract);
      setCurrentTab('contracts');
      triggerNotification('Contract initialized successfully!');
    } catch (err: any) {
      triggerNotification(err.message, false);
    }
  };

  // Milestone creation helper
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !msTitle || !msAmount) return;
    try {
      const milestoneCol = collection(db, 'efado_milestones');
      const msRef = doc(milestoneCol);
      const newMs: FreelanceMilestone = {
        id: msRef.id,
        contractId: selectedContract.id,
        title: msTitle,
        amount: Number(msAmount),
        status: 'Pending',
        dueDate: msDueDate || 'No Due Date'
      };
      await setDoc(msRef, newMs);
      
      setMsTitle('');
      setMsAmount(100);
      setMsDueDate('');
      setShowMilestoneForm(false);
      triggerNotification('New milestone added successfully!');
    } catch (err: any) {
      triggerNotification(err.message, false);
    }
  };

  // Deliver Milestone (Freelancer upload deliverable)
  const handleDeliverMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !activeMilestoneId || !deliverableText) return;
    try {
      await updateDoc(doc(db, 'efado_milestones', activeMilestoneId), {
        status: 'Delivered',
        deliverableDescription: deliverableText,
        deliverableFile: deliverableLink || ''
      });

      // Notify Client
      await createNotification(
        selectedContract.clientId,
        'milestone_delivered',
        `${freelancerProfile?.displayName || 'Freelancer'} submitted work for milestone: "${contractMilestones.find(m => m.id === activeMilestoneId)?.title}"`
      );

      setDeliverableText('');
      setDeliverableLink('');
      setActiveMilestoneId('');
      setShowDeliverableForm(false);
      triggerNotification('Work delivered successfully! Awaiting client approval.');
    } catch (err: any) {
      triggerNotification(err.message, false);
    }
  };

  // Release Milestone Payment (Client approves deliverable and sends funds from virtual balance)
  const handleReleasePayment = async (milestone: FreelanceMilestone) => {
    if (!selectedContract) return;
    try {
      // Validate Client Balance
      const clientBal = user.usd_balance || 0;
      if (clientBal < milestone.amount) {
        triggerNotification(`Insufficient wallet balance. You need $${milestone.amount} but have $${clientBal}. Please deposit first.`, false);
        return;
      }

      // Perform direct transactions using Firestore runTransaction or batch edits
      await runTransaction(db, async (transaction) => {
        const clientRef = doc(db, 'users', selectedContract.clientId);
        const freelancerRef = doc(db, 'users', selectedContract.freelancerId);
        const flProfileRef = doc(db, 'efado_freelancers', selectedContract.freelancerId);
        const msRef = doc(db, 'efado_milestones', milestone.id);

        const clientSnap = await transaction.get(clientRef);
        const freelancerSnap = await transaction.get(freelancerRef);

        if (!clientSnap.exists()) throw new Error('Client user account not found');
        const currentClientBal = clientSnap.data().usd_balance || 0;
        if (currentClientBal < milestone.amount) throw new Error('Insufficient balance in escrow client wallet');

        // Deduct from Client, add to Freelancer
        transaction.update(clientRef, {
          usd_balance: currentClientBal - milestone.amount
        });

        const currentFreelancerBal = freelancerSnap.exists() ? (freelancerSnap.data().usd_balance || 0) : 0;
        transaction.set(freelancerRef, {
          usd_balance: currentFreelancerBal + milestone.amount
        }, { merge: true });

        // Update Milestone
        transaction.update(msRef, {
          status: 'Paid'
        });

        // Increment freelancer completed jobs counter
        const flProfileSnap = await transaction.get(flProfileRef);
        if (flProfileSnap.exists()) {
          transaction.update(flProfileRef, {
            totalJobsCompleted: (flProfileSnap.data().totalJobsCompleted || 0) + 1
          });
        }
      });

      // Write direct Transactions in /transactions
      const transactionCol = collection(db, 'transactions');
      
      // Client payment transaction
      await addDoc(transactionCol, {
        userId: selectedContract.clientId,
        type: 'payment',
        amount: milestone.amount,
        currency: 'USD',
        status: 'completed',
        hub: 'EFADOWORKS',
        purpose: `Payment for Freelancer Contract: ${selectedContract.jobTitle}`,
        reference: `FL_PAY_${selectedContract.id}_${milestone.id}`,
        timestamp: new Date().toISOString()
      });

      // Freelancer payout transaction
      await addDoc(transactionCol, {
        userId: selectedContract.freelancerId,
        type: 'payout',
        amount: milestone.amount,
        currency: 'USD',
        status: 'completed',
        hub: 'EFADOWORKS',
        purpose: `Payout received for Contract: ${selectedContract.jobTitle}`,
        reference: `FL_PAY_${selectedContract.id}_${milestone.id}`,
        timestamp: new Date().toISOString()
      });

      // Notify Freelancer
      await createNotification(
        selectedContract.freelancerId,
        'payment_received',
        `Excellent! Client approved deliverable and released payment of $${milestone.amount} for "${milestone.title}"`
      );

      triggerNotification(`Payment of $${milestone.amount} released to freelancer!`);
    } catch (err: any) {
      triggerNotification(err.message, false);
    }
  };

  // Complete Contract & Leave Review
  const handleCompleteContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;
    try {
      await updateDoc(doc(db, 'efado_contracts', selectedContract.id), {
        status: 'Completed',
        completedAt: new Date().toISOString()
      });

      // Write Review
      const reviewCol = collection(db, 'efado_reviews');
      const reviewRef = doc(reviewCol);
      await setDoc(reviewRef, {
        id: reviewRef.id,
        contractId: selectedContract.id,
        fromUserId: user.uid,
        fromUserName: clientProfile?.companyName || user.displayName || 'Client',
        toUserId: selectedContract.freelancerId,
        roleOfReviewer: 'Client',
        rating: Number(reviewRating),
        comment: reviewComment,
        createdAt: new Date().toISOString()
      });

      // Average freelancer rating update
      const flProfileRef = doc(db, 'efado_freelancers', selectedContract.freelancerId);
      const flSnap = await getDoc(flProfileRef);
      if (flSnap.exists()) {
        const currentRating = flSnap.data().rating || 5;
        const currentCount = flSnap.data().totalJobsCompleted || 1;
        const newRating = Number(((currentRating * currentCount + reviewRating) / (currentCount + 1)).toFixed(1));
        await updateDoc(flProfileRef, {
          rating: newRating
        });
      }

      // Update Job status to Completed
      await updateDoc(doc(db, 'efado_jobs', selectedContract.jobId), {
        status: 'Completed',
        updatedAt: new Date().toISOString()
      });

      // Notify Freelancer
      await createNotification(
        selectedContract.freelancerId,
        'new_review',
        `Your contract on "${selectedContract.jobTitle}" is marked complete. You received a ${reviewRating}★ review!`
      );

      setReviewComment('');
      setShowReviewForm(false);
      setSelectedContract(null);
      setCurrentTab('contracts');
      triggerNotification('Contract marked complete! Review submitted.');
    } catch (err: any) {
      triggerNotification(err.message, false);
    }
  };

  // Filter jobs based on search & category
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
    const matchesStatus = job.status === 'Open';
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Deposit test virtual balance helper
  const handleDepositVirtualFunds = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentBal = user.usd_balance || 0;
      await updateDoc(userRef, {
        usd_balance: currentBal + 1000
      });
      triggerNotification('Deposited $1,000 test funds to your E-fado escrow wallet!');
    } catch (e: any) {
      triggerNotification(e.message, false);
    }
  };

  return (
    <div 
      className="relative text-slate-900 min-h-screen font-sans rounded-[2.5rem] overflow-hidden shadow-2xl border border-amber-500/10"
      style={{
        backgroundImage: `url(${efadoworksBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'local'
      }}
    >
      {/* Light soft glossy overlay to guarantee extreme accessibility and high-end golden shimmer */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] pointer-events-none rounded-[2.5rem]" />

      {/* Dynamic Notifications Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border border-emerald-500 max-w-md"
          >
            <Check className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 p-4 bg-rose-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border border-rose-500 max-w-md"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EFADOworks Online Header Area */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        
        {/* Marketplace Hero & Sub-navigation bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-900/10 pb-8 mb-8 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white rounded-full text-[9px] font-black tracking-widest uppercase shadow">
                Secure Escrow Enabled
              </div>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-slate-900/10 rounded-xl hover:bg-slate-900/20 transition-colors border border-slate-900/10"
              >
                <Bell className="w-4 h-4 text-slate-800" />
                {notifications.some(n => !n.isRead) && (
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-fuchsia-600 animate-pulse" />
                )}
              </button>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-slate-950 via-slate-800 to-indigo-950">
              EFADOworks <span className="text-fuchsia-700">Online</span>
            </h1>
            <p className="text-slate-700 text-sm font-semibold">
              E-fado's decentralized professional hub connecting tactical experts with strategic clients.
            </p>
          </div>

          {/* Quick Wallet Check (with rich golden metallic styling to make the test balance stand out beautifully) */}
          <div className="flex items-center gap-4 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border border-amber-300 shadow-xl rounded-2xl p-4 text-slate-950">
            <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center shadow-inner">
              <Wallet className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <div className="text-[10px] font-black text-amber-950 uppercase tracking-widest">Escrow Trust Balance</div>
              <div className="text-xl font-black text-slate-950">${(user.usd_balance || 0).toLocaleString()}</div>
            </div>
            <button 
              onClick={handleDepositVirtualFunds}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-white transition-all rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 duration-200"
            >
              + Deposit Test Funds
            </button>
          </div>
        </div>

        {/* Live Notifications dropdown feed */}
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 border border-slate-200 rounded-2xl p-6 mb-8 shadow-2xl relative z-40 max-w-lg ml-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="font-black text-xs uppercase tracking-widest text-slate-600">In-App Notification Feed</span>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar">
              {notifications.length > 0 ? notifications.map(n => (
                <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-fuchsia-600 mt-1.5 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-800 font-semibold">{n.message}</p>
                    <span className="text-[8px] font-black text-slate-500 uppercase block mt-1">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 text-xs font-bold text-center py-6">No signals or notifications logged.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Roles and Onboarding Section */}
        {loadingProfile ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Accessing Secure Ledger...</p>
          </div>
        ) : !freelancerProfile && !clientProfile ? (
          /* Profile Choice Screen */
          <div className="max-w-4xl mx-auto py-12 text-center">
            <h2 className="text-3xl font-black text-slate-950 tracking-tight mb-4">ONBOARD TO THE MARKETPLACE</h2>
            <p className="text-slate-700 max-w-lg mx-auto mb-10 text-sm font-semibold">
              E-fado connects vetted agencies with global enterprises. Choose your role below to start transacting securely with escrow protection.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Option: Freelancer */}
              <button 
                onClick={() => setShowFreelancerOnboard(true)}
                className="p-10 rounded-[2.5rem] bg-white/90 backdrop-blur-md border border-indigo-100 hover:border-indigo-400 text-left transition-all duration-300 group shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                  <Briefcase className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase group-hover:text-indigo-600 transition-colors">Manifest as Freelancer</h3>
                <p className="text-slate-600 text-xs font-semibold leading-relaxed mb-6">
                  Offer professional skills, bid on posted jobs, submit milestone deliverables, and receive secure payouts immediately.
                </p>
                <span className="inline-flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-widest">
                  Create Freelance Profile <ChevronRight className="w-4 h-4" />
                </span>
              </button>

              {/* Option: Client */}
              <button 
                onClick={() => setShowClientOnboard(true)}
                className="p-10 rounded-[2.5rem] bg-white/90 backdrop-blur-md border border-fuchsia-100 hover:border-fuchsia-400 text-left transition-all duration-300 group shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-full blur-2xl group-hover:bg-fuchsia-500/10 transition-colors" />
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-50 border border-fuchsia-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-all">
                  <User className="w-7 h-7 text-fuchsia-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase group-hover:text-fuchsia-600 transition-colors">Manifest as Client</h3>
                <p className="text-slate-600 text-xs font-semibold leading-relaxed mb-6">
                  Post high-skill projects, invite bids, hire world-class talent, configure escrow milestones, and secure delivery.
                </p>
                <span className="inline-flex items-center gap-2 text-fuchsia-600 text-xs font-black uppercase tracking-widest">
                  Create Client Profile <ChevronRight className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Main Interactive Dashboard Dashboard */
          <div>
            
            {/* Tab navigation bar & Role Switcher */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white/90 backdrop-blur-md border border-amber-500/10 rounded-2xl p-2 mb-8 gap-4 shadow-lg">
              
              
              {/* Dashboard Tabs depending on active role */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setCurrentTab('dashboard'); setSelectedJob(null); setSelectedContract(null); }}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Dashboard
                </button>

                {activeRole === 'CLIENT' ? (
                  <>
                    <button
                      onClick={() => { setCurrentTab('post-job'); setSelectedJob(null); setSelectedContract(null); }}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'post-job' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Post a Job
                    </button>
                    <button
                      onClick={() => { setCurrentTab('manage-jobs'); setSelectedJob(null); setSelectedContract(null); }}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'manage-jobs' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      My Job Posts
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setCurrentTab('browse-jobs'); setSelectedJob(null); setSelectedContract(null); }}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'browse-jobs' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Browse Jobs
                    </button>
                    <button
                      onClick={() => { setCurrentTab('proposals'); setSelectedJob(null); setSelectedContract(null); }}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'proposals' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      My Proposals
                    </button>
                  </>
                )}

                <button
                  onClick={() => { setCurrentTab('contracts'); setSelectedJob(null); setSelectedContract(null); }}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'contracts' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Contracts ({myContracts.length})
                </button>
              </div>

              {/* Role Toggle Switcher */}
              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {freelancerProfile && (
                  <button 
                    onClick={() => { setActiveRole('FREELANCER'); setCurrentTab('dashboard'); }}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeRole === 'FREELANCER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Freelancer
                  </button>
                )}
                {clientProfile && (
                  <button 
                    onClick={() => { setActiveRole('CLIENT'); setCurrentTab('dashboard'); }}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeRole === 'CLIENT' ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Client
                  </button>
                )}
              </div>
            </div>

            {/* Content Switcher */}
            <AnimatePresence mode="wait">
              
              {/* TAB: DASHBOARD */}
              {currentTab === 'dashboard' && !selectedJob && !selectedContract && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg text-slate-900">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Engagements</span>
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="text-3xl font-black text-slate-900">
                        {myContracts.filter(c => c.status === 'Active').length}
                      </div>
                      <p className="text-xs text-slate-600 mt-2">Active contracts with milestone tracking.</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg text-slate-900">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {activeRole === 'CLIENT' ? 'Total Jobs Posted' : 'Total Bids Submitted'}
                        </span>
                        <Layers className="w-5 h-5 text-fuchsia-600" />
                      </div>
                      <div className="text-3xl font-black text-slate-900">
                        {activeRole === 'CLIENT' ? (clientProfile?.totalJobsPosted || 0) : myBids.length}
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        {activeRole === 'CLIENT' ? 'Vetted and listed publicly on hub' : 'Pending review by hiring managers'}
                      </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg text-slate-900">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Escrow Trust Rating</span>
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      </div>
                      <div className="text-3xl font-black text-slate-900">
                        {activeRole === 'CLIENT' ? '5.0' : (freelancerProfile?.rating || '5.0')}★
                      </div>
                      <p className="text-xs text-slate-600 mt-2">Based on handshake transaction outcomes.</p>
                    </div>
                  </div>

                  {/* Profile info and role manifest status */}
                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-white via-indigo-50/50 to-white border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-2xl font-black shrink-0 shadow-sm">
                        {user.displayName ? user.displayName[0].toUpperCase() : 'A'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">{activeRole === 'CLIENT' ? clientProfile?.companyName : freelancerProfile?.displayName}</h3>
                          <span className="px-3 py-0.5 bg-indigo-100 border border-indigo-200 rounded-full text-[8px] font-black uppercase tracking-widest text-indigo-700 shadow-sm">
                            {activeRole}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs font-semibold max-w-xl mt-1">
                          {activeRole === 'CLIENT' ? "E-fado's enterprise hiring manager" : `${freelancerProfile?.title} — ${freelancerProfile?.bio}`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Secondary Role Activation button if they only have one profile */}
                    {activeRole === 'CLIENT' && !freelancerProfile && (
                      <button 
                        onClick={() => setShowFreelancerOnboard(true)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 transition-all rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md hover:scale-[1.02]"
                      >
                        Activate Freelancer Role
                      </button>
                    )}
                    {activeRole === 'FREELANCER' && !clientProfile && (
                      <button 
                        onClick={() => setShowClientOnboard(true)}
                        className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 transition-all rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md hover:scale-[1.02]"
                      >
                        Activate Client Role
                      </button>
                    )}
                  </div>

                  {/* Dynamic Action items section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Active Contracts Summary Section */}
                    <div className="p-6 rounded-[2rem] bg-white/95 backdrop-blur-md border border-slate-200 space-y-4 shadow-lg">
                      <h4 className="font-black text-sm uppercase tracking-widest text-slate-700 border-b border-slate-100 pb-3">Active Contracts Overview</h4>
                      <div className="space-y-3">
                        {myContracts.filter(c => c.status === 'Active').slice(0, 3).map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => { setSelectedContract(c); setCurrentTab('contracts'); }}
                            className="p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{c.jobTitle}</p>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {activeRole === 'CLIENT' ? `Partner: ${c.freelancerName}` : `Employer: ${c.clientName}`}
                              </span>
                            </div>
                            <span className="text-xs font-black text-emerald-600 shrink-0">${c.agreedAmount}</span>
                          </div>
                        ))}
                        {myContracts.filter(c => c.status === 'Active').length === 0 && (
                          <p className="text-slate-500 text-xs font-bold py-6 text-center">No active contracts found. Proceed to post or apply for jobs.</p>
                        )}
                      </div>
                    </div>

                    {/* Jobs Feed Snapshot */}
                    <div className="p-6 rounded-[2rem] bg-white/95 backdrop-blur-md border border-slate-200 space-y-4 shadow-lg">
                      <h4 className="font-black text-sm uppercase tracking-widest text-slate-700 border-b border-slate-100 pb-3">
                        {activeRole === 'CLIENT' ? 'My Open Listings' : 'Open Marketplace Opportunities'}
                      </h4>
                      <div className="space-y-3">
                        {(activeRole === 'CLIENT' ? jobs.filter(j => j.clientId === user.uid && j.status === 'Open') : jobs.filter(j => j.status === 'Open')).slice(0, 3).map(job => (
                          <div 
                            key={job.id} 
                            onClick={() => { setSelectedJob(job); setCurrentTab(activeRole === 'CLIENT' ? 'manage-jobs' : 'browse-jobs'); }}
                            className="p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1">{job.title}</p>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{job.category}</span>
                            </div>
                            <span className="text-xs font-black text-indigo-600 shrink-0">${job.budgetMin}-${job.budgetMax}</span>
                          </div>
                        ))}
                        {jobs.filter(j => j.status === 'Open').length === 0 && (
                          <p className="text-slate-500 text-xs font-bold py-6 text-center">No open listings logged.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB: BROWSE JOBS (Freelancer View) */}
              {currentTab === 'browse-jobs' && !selectedJob && (
                <motion.div 
                  key="browse-jobs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Search and Categories controls */}
                  <div className="flex flex-col md:flex-row items-center gap-4 bg-white/90 backdrop-blur-md p-4 border border-slate-200 rounded-2xl shadow-md">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input 
                        type="text"
                        placeholder="Search open positions by keyword, skill or technology..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none rounded-xl text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div className="flex gap-2 items-center text-xs font-black text-slate-600 shrink-0 uppercase tracking-widest">
                      <Filter className="w-4 h-4 text-indigo-600" /> Category:
                    </div>
                    <select 
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-black uppercase text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Jobs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredJobs.length > 0 ? filteredJobs.map(job => (
                      <div 
                        key={job.id}
                        className="p-6 rounded-[2rem] bg-white/95 backdrop-blur-md border border-slate-200 hover:border-indigo-400 hover:bg-white transition-all duration-300 flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-4 gap-2">
                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest truncate max-w-[180px] shadow-sm">
                              {job.category}
                            </span>
                            <div className="text-right">
                              <span className="text-xs font-black text-emerald-700 uppercase italic">
                                ${job.budgetMin} - ${job.budgetMax}
                              </span>
                              <p className="text-[8px] font-black text-slate-500 uppercase mt-0.5">{job.budgetType === 'Fixed' ? 'Fixed Scope' : 'Hourly Rate'}</p>
                            </div>
                          </div>

                          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-2 line-clamp-1">{job.title}</h3>
                          <p className="text-slate-600 text-xs font-semibold leading-relaxed line-clamp-3 italic mb-6">
                            "{job.description}"
                          </p>
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-1">
                            {job.skills.map((s, idx) => (
                              <span key={idx} className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[8.5px] font-black uppercase tracking-wider text-slate-600">
                                {s}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{job.duration}</span>
                            </div>
                            <button 
                              onClick={() => setSelectedJob(job)}
                              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
                            >
                              Explore Opportunity
                            </button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-300 bg-white/50 rounded-[3rem]">
                        <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Scanning open project nodes...</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB: MY PROPOSALS (Freelancer View) */}
              {currentTab === 'proposals' && (
                <motion.div 
                  key="proposals"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">My Proposals & Bids</h3>
                  <div className="space-y-4">
                    {myBids.map(bid => (
                      <div key={bid.id} className="p-6 rounded-[2rem] bg-white/95 backdrop-blur-md border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
                        <div className="space-y-2">
                          <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{bid.jobTitle}</h4>
                          <p className="text-slate-600 text-xs font-semibold italic max-w-2xl line-clamp-2">"{bid.coverLetter}"</p>
                          <div className="flex gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Estimated: {bid.estimatedDuration}</span>
                            <span>•</span>
                            <span>Submitted: {new Date(bid.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                          <div className="text-right">
                            <span className="text-lg font-black text-emerald-700">${bid.bidAmount}</span>
                            <p className="text-[8px] font-black text-slate-500 uppercase">My Bid Amount</p>
                          </div>
                          
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                            bid.status === 'Accepted' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                            bid.status === 'Rejected' ? 'bg-rose-50 border border-rose-200 text-rose-700' :
                            'bg-amber-50 border border-amber-200 text-amber-700'
                          }`}>
                            {bid.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {myBids.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-slate-300 bg-white/50 rounded-[3rem]">
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No active proposals logged.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB: POST A JOB (Client View) */}
              {currentTab === 'post-job' && (
                <motion.div 
                  key="post-job"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="max-w-3xl mx-auto"
                >
                  <div className="p-8 rounded-[2.5rem] bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Deploy Freelance Project Node</h3>
                      <p className="text-slate-600 text-xs font-semibold mt-1">Specify parameters to broadcast your project to our vetted freelancer network.</p>
                    </div>

                    <form onSubmit={handlePostJob} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Project Title</label>
                        <input 
                          type="text"
                          placeholder="e.g. Design responsive Landing Page with Figma and Tailwind"
                          value={jobTitle}
                          onChange={e => setJobTitle(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-fuchsia-600 focus:bg-white text-slate-950 rounded-xl text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Project Description & Requirements</label>
                        <textarea 
                          rows={6}
                          placeholder="Provide a comprehensive breakdown of objectives, requirements, and deliverables..."
                          value={jobDesc}
                          onChange={e => setJobDesc(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-fuchsia-600 focus:bg-white text-slate-950 rounded-xl text-sm font-semibold outline-none transition-all resize-none placeholder:text-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Category</label>
                          <select 
                            value={jobCat}
                            onChange={e => setJobCat(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase outline-none focus:border-fuchsia-600 cursor-pointer"
                          >
                            {categories.filter(c => c !== 'All').map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Expected Duration</label>
                          <input 
                            type="text"
                            placeholder="e.g. 1-3 Months, 2 Weeks, Flexible"
                            value={jobDuration}
                            onChange={e => setJobDuration(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-fuchsia-600 focus:bg-white text-slate-950 rounded-xl text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Required Skills (Comma-separated)</label>
                        <input 
                          type="text"
                          placeholder="e.g. React, UI/UX, Tailwind CSS, TypeScript"
                          value={jobSkillsRequired}
                          onChange={e => setJobSkillsRequired(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-fuchsia-600 focus:bg-white text-slate-950 rounded-xl text-sm font-semibold outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>

                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-inner">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Budget Framework</span>
                          <div className="flex bg-slate-200/80 p-1 rounded-xl border border-slate-300">
                            <button
                              type="button"
                              onClick={() => setJobBudgetType('Fixed')}
                              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${jobBudgetType === 'Fixed' ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                              Fixed Price
                            </button>
                            <button
                              type="button"
                              onClick={() => setJobBudgetType('Hourly')}
                              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${jobBudgetType === 'Hourly' ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
                            >
                              Hourly Rate
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">Minimum Budget ($)</span>
                            <input 
                              type="number"
                              value={jobBudgetMin}
                              onChange={e => setJobBudgetMin(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-fuchsia-600 rounded-lg text-sm font-bold text-slate-950 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">Maximum Budget ($)</span>
                            <input 
                              type="number"
                              value={jobBudgetMax}
                              onChange={e => setJobBudgetMax(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-fuchsia-600 rounded-lg text-sm font-bold text-slate-950 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 active:scale-98 transition-all"
                      >
                        Publish Open Project
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* TAB: MY JOB POSTS (Client View) */}
              {currentTab === 'manage-jobs' && !selectedJob && (
                <motion.div 
                  key="manage-jobs"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">My Posted Job Opportunities</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {jobs.filter(j => j.clientId === user.uid).map(job => (
                      <div 
                        key={job.id} 
                        className="p-6 rounded-[2rem] bg-white/95 backdrop-blur-md border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-lg"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{job.title}</h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${
                              job.status === 'Open' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-slate-100 border border-slate-200 text-slate-500'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs font-semibold tracking-wide">{job.category} • Budget Range: ${job.budgetMin}-${job.budgetMax}</p>
                        </div>

                        {job.status === 'Open' ? (
                          <button 
                            onClick={() => setSelectedJob(job)}
                            className="px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-md transition-all"
                          >
                            Manage Bids
                          </button>
                        ) : (
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">In Progress / Closed</span>
                        )}
                      </div>
                    ))}
                    {jobs.filter(j => j.clientId === user.uid).length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-slate-300 bg-white/50 rounded-[3rem]">
                        <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No posted opportunities logged.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB: CONTRACTS (Shared) */}
              {currentTab === 'contracts' && !selectedContract && (
                <motion.div 
                  key="contracts"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Active Escrow Contracts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myContracts.map(contract => (
                      <div 
                        key={contract.id}
                        className="p-6 rounded-[2rem] bg-white/95 backdrop-blur-md border border-slate-200 hover:border-indigo-400 hover:bg-white transition-all duration-300 flex flex-col justify-between shadow-lg"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                              contract.status === 'Active' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                            }`}>
                              {contract.status}
                            </span>
                            <span className="text-sm font-black text-emerald-700">${contract.agreedAmount}</span>
                          </div>

                          <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{contract.jobTitle}</h4>
                          <p className="text-slate-600 text-xs font-semibold">
                            {activeRole === 'CLIENT' ? `Freelancer Associate: ${contract.freelancerName}` : `Employer Client: ${contract.clientName}`}
                          </p>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">
                            Started: {new Date(contract.startedAt).toLocaleDateString()}
                          </span>
                          <button 
                            onClick={() => setSelectedContract(contract)}
                            className="px-6 py-2 bg-slate-900 hover:bg-indigo-600 hover:text-white text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
                          >
                            Open Escrow Center
                          </button>
                        </div>
                      </div>
                    ))}
                    {myContracts.length === 0 && (
                      <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-300 bg-white/50 rounded-[3rem]">
                        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No active or historic contracts found.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* NESTED VIEW: SELECTED JOB OPPORTUNITY / REVIEW PROPOSALS */}
            {selectedJob && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Back button */}
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black text-xs uppercase tracking-widest transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-indigo-600" /> Return to Opportunities
                </button>

                {/* Job Specs */}
                <div className="p-8 rounded-[2.5rem] bg-white/95 backdrop-blur-md border border-slate-200 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{selectedJob.category}</span>
                        <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">{selectedJob.title}</h2>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Posted by: {selectedJob.clientName}</p>
                      </div>
                      <div className="text-right bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                        <span className="text-lg font-black text-emerald-700">${selectedJob.budgetMin} - ${selectedJob.budgetMax}</span>
                        <p className="text-[8px] font-black text-slate-500 uppercase">{selectedJob.budgetType === 'Fixed' ? 'Fixed Price' : 'Hourly Budget'}</p>
                      </div>
                    </div>

                    <p className="text-slate-700 text-sm font-semibold leading-relaxed whitespace-pre-line italic">
                      "{selectedJob.description}"
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.skills.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-600">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-[11px] font-black text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-100">
                      <span>Duration: {selectedJob.duration}</span>
                      <span>•</span>
                      <span>Published: {new Date(selectedJob.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Submit bid panel if Freelancer */}
                    {activeRole === 'FREELANCER' && selectedJob.clientId !== user.uid && !myBids.some(b => b.jobId === selectedJob.id) && (
                      <div className="pt-6 border-t border-slate-100">
                        {!showProposalForm ? (
                          <button 
                            onClick={() => setShowProposalForm(true)}
                            className="px-8 py-3.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:opacity-95"
                          >
                            Submit Tactical Proposal
                          </button>
                        ) : (
                          <motion.form 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            onSubmit={handleSubmitProposal}
                            className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 shadow-inner"
                          >
                            <h4 className="font-black text-sm uppercase tracking-widest text-slate-900">Submit Proposal Specifications</h4>
                            
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Cover Letter & Approach Description</label>
                              <textarea 
                                rows={4}
                                placeholder="Describe your experience, technical stack, and how you plan to execute this specific task..."
                                value={proposalCover}
                                onChange={e => setProposalCover(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all resize-none placeholder:text-slate-400"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">My Bid Price ($)</span>
                                <input 
                                  type="number"
                                  value={proposalAmount}
                                  onChange={e => setProposalAmount(Number(e.target.value))}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-sm font-bold text-slate-950 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">Estimated Duration</span>
                                <input 
                                  type="text"
                                  placeholder="e.g. 5 Days, 1 Month"
                                  value={proposalDuration}
                                  onChange={e => setProposalDuration(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400"
                                />
                              </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                              <button 
                                type="submit"
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md"
                              >
                                Submit Bid Proposal
                              </button>
                              <button 
                                type="button"
                                onClick={() => setShowProposalForm(false)}
                                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-[10px] font-black uppercase text-slate-700 tracking-widest"
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Proposals Review Panel (Client View) */}
                {selectedJob.clientId === user.uid && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-950">Received Proposals ({jobBids.length})</h3>
                    <div className="space-y-4">
                      {jobBids.map(bid => (
                        <div key={bid.id} className="p-6 rounded-[2rem] bg-white/95 backdrop-blur-md border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-700">
                                {bid.freelancerName[0]}
                              </div>
                              <div>
                                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">{bid.freelancerName}</h4>
                                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">{bid.freelancerTitle}</p>
                              </div>
                              <span className="flex items-center gap-1 text-xs text-amber-500 font-bold ml-4">
                                <Star className="w-3.5 h-3.5 fill-amber-500" /> {bid.freelancerRating || 5}
                              </span>
                            </div>

                            <p className="text-slate-600 text-xs font-semibold leading-relaxed italic mt-4">
                              "{bid.coverLetter}"
                            </p>
                            
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Estimated Duration: {bid.estimatedDuration}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 justify-between">
                            <div className="text-right">
                              <span className="text-xl font-black text-emerald-700">${bid.bidAmount}</span>
                              <p className="text-[8px] font-black text-slate-500 uppercase">Bid Offer</p>
                            </div>
                            <button 
                              onClick={() => handleHireFreelancer(bid)}
                              className="w-full md:w-auto px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all"
                            >
                              Hire Freelancer
                            </button>
                          </div>
                        </div>
                      ))}
                      {jobBids.length === 0 && (
                        <div className="py-12 text-center border-2 border-dashed border-slate-300 bg-white/50 rounded-[3rem]">
                          <MessageSquare className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-500 font-black uppercase text-xs tracking-widest">Awaiting tactical bid submissions...</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* NESTED VIEW: CONTRACT & ESCROW MILESTONES CENTER */}
            {selectedContract && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                {/* Back button */}
                <button 
                  onClick={() => setSelectedContract(null)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-black text-xs uppercase tracking-widest transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-indigo-600" /> Return to Contracts
                </button>

                {/* Contract Specs Panel */}
                <div className="p-8 rounded-[2.5rem] bg-white/95 backdrop-blur-md border border-slate-200 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px]" />

                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                          Active Escrow Contract
                        </span>
                        <span className="text-[10px] font-black text-slate-500">ID: {selectedContract.id.substring(0, 8)}...</span>
                      </div>
                      <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">{selectedContract.jobTitle}</h2>
                      <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600 mt-2">
                        <span>Client Employer: <span className="text-slate-900">{selectedContract.clientName}</span></span>
                        <span>•</span>
                        <span>Freelancer Specialist: <span className="text-slate-900">{selectedContract.freelancerName}</span></span>
                      </div>
                    </div>

                    <div className="text-right bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                      <span className="text-2xl font-black text-emerald-700">${selectedContract.agreedAmount}</span>
                      <p className="text-[8px] font-black text-slate-500 uppercase">Secure Escrow Hold</p>
                    </div>
                  </div>

                  {/* Escrow milestone breakdown */}
                  <div className="pt-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-black text-sm uppercase tracking-widest text-slate-600">Escrow Milestone Ledger</h3>
                      {activeRole === 'CLIENT' && selectedContract.status === 'Active' && (
                        <button 
                          onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                          className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-300 text-slate-700 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 text-indigo-600" /> Create Milestone
                        </button>
                      )}
                    </div>

                    {/* Create Milestone form slider */}
                    {showMilestoneForm && (
                      <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        onSubmit={handleCreateMilestone}
                        className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-inner"
                      >
                        <h4 className="font-black text-xs uppercase tracking-widest text-slate-800">Milestone Definition</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <input 
                            type="text" 
                            placeholder="Milestone Title"
                            value={msTitle}
                            onChange={e => setMsTitle(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-950 outline-none focus:border-indigo-500"
                          />
                          <input 
                            type="number" 
                            placeholder="Amount ($)"
                            value={msAmount}
                            onChange={e => setMsAmount(Number(e.target.value))}
                            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-950 outline-none focus:border-indigo-500"
                          />
                          <input 
                            type="text" 
                            placeholder="Due Date / Estimate"
                            value={msDueDate}
                            onChange={e => setMsDueDate(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-950 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">Add Milestone</button>
                          <button type="button" onClick={() => setShowMilestoneForm(false)} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest">Cancel</button>
                        </div>
                      </motion.form>
                    )}

                    {/* Milestones list */}
                    <div className="space-y-4">
                      {contractMilestones.map((ms, idx) => (
                        <div key={ms.id} className="p-5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black uppercase text-slate-400">M-{idx + 1}</span>
                              <h4 className="text-base font-black uppercase text-slate-900">{ms.title}</h4>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estimated Delivery: {ms.dueDate}</span>
                            
                            {/* Deliverable info if delivered */}
                            {ms.status === 'Delivered' && (
                              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl mt-3 space-y-1 text-xs text-slate-800">
                                <p className="font-black text-[9px] text-indigo-700 uppercase tracking-widest">Deliverable Submission:</p>
                                <p className="text-slate-700 italic">"{ms.deliverableDescription}"</p>
                                {ms.deliverableFile && (
                                  <a href={ms.deliverableFile} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 font-bold underline mt-2 hover:text-indigo-800">
                                    <ExternalLink className="w-3.5 h-3.5" /> View Deliverable Artifact
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end">
                            <div className="text-right">
                              <span className="text-lg font-black text-emerald-700">${ms.amount}</span>
                              <p className="text-[8px] font-black text-slate-500 uppercase">Valuation</p>
                            </div>

                            {/* Milestone Actions based on roles & status */}
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                ms.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                ms.status === 'Delivered' ? 'bg-fuchsia-55 border border-fuchsia-200 text-fuchsia-700' :
                                'bg-amber-50 border border-amber-200 text-amber-700'
                              }`}>
                                {ms.status}
                              </span>

                              {/* Freelancer action: Submit Deliverable */}
                              {activeRole === 'FREELANCER' && ms.status === 'In Progress' && (
                                <button 
                                  onClick={() => { setActiveMilestoneId(ms.id); setShowDeliverableForm(true); }}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow"
                                >
                                  Deliver Work
                                </button>
                              )}

                              {/* Client action: Approve & Release funds */}
                              {activeRole === 'CLIENT' && ms.status === 'Delivered' && (
                                <button 
                                  onClick={() => handleReleasePayment(ms)}
                                  className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/15"
                                >
                                  Approve & Pay
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deliver Work dialog popup modal */}
                  {showDeliverableForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                      <motion.form 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onSubmit={handleDeliverMilestone}
                        className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded-3xl space-y-4 shadow-2xl"
                      >
                        <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">Submit Milestone Deliverables</h4>
                        
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Deliverable Summary & Description</span>
                          <textarea 
                            rows={4}
                            required
                            placeholder="Summarize the work completed, links, or documentation details..."
                            value={deliverableText}
                            onChange={e => setDeliverableText(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 rounded-xl text-sm font-semibold outline-none resize-none focus:bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Artifact URL (Optional)</span>
                          <input 
                            type="text"
                            placeholder="e.g. GitHub Repository, Google Drive URL, Figma link"
                            value={deliverableLink}
                            onChange={e => setDeliverableLink(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 rounded-xl text-sm font-semibold outline-none focus:bg-white"
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">Submit Deliverable</button>
                          <button type="button" onClick={() => setShowDeliverableForm(false)} className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                        </div>
                      </motion.form>
                    </div>
                  )}

                  {/* Contract Completion / Review triggers (Client View) */}
                  {activeRole === 'CLIENT' && selectedContract.status === 'Active' && contractMilestones.every(m => m.status === 'Paid') && (
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 shadow-sm">
                      <div>
                        <h4 className="font-black text-base text-slate-900 uppercase tracking-tight">All Milestones Settled</h4>
                        <p className="text-slate-600 text-xs font-semibold">You have paid all contract milestones. Mark this job contract as completed.</p>
                      </div>
                      <button 
                        onClick={() => setShowReviewForm(true)}
                        className="px-6 py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md"
                      >
                        Complete Contract & Review
                      </button>
                    </div>
                  )}

                  {/* Mark Complete & Review Form Slider */}
                  {showReviewForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
                      <motion.form 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onSubmit={handleCompleteContract}
                        className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded-3xl space-y-4 shadow-2xl"
                      >
                        <h4 className="font-black text-lg text-slate-900 uppercase tracking-tight">Rate and Review Freelancer</h4>
                        
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Handshake Rating (1-5 Stars)</span>
                          <div className="flex gap-1.5 text-amber-500 py-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button 
                                key={star}
                                type="button" 
                                onClick={() => setReviewRating(star)}
                                className="focus:outline-none"
                              >
                                <Star className={`w-7 h-7 ${star <= reviewRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Feedback / Comment</span>
                          <textarea 
                            rows={4}
                            required
                            placeholder="Write an objective, honest review of the specialist's professionalism and delivery quality..."
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 rounded-xl text-sm font-semibold outline-none resize-none focus:bg-white"
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md">Submit Completed Ledger</button>
                          <button type="button" onClick={() => setShowReviewForm(false)} className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                        </div>
                      </motion.form>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>
        )}

      </div>

      {/* MODAL POPUPS: ONBOARD FORMS */}
      {showFreelancerOnboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl bg-white border border-slate-200 p-8 rounded-[2.5rem] space-y-6 relative max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl"
          >
            <button 
              onClick={() => setShowFreelancerOnboard(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-950"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Onboard Freelance Talent Profile</h3>
              <p className="text-slate-600 text-xs font-semibold mt-1">Specify your professional details to manifest on the community network.</p>
            </div>
            
            <form onSubmit={handleOnboardFreelancer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Professional Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Lead Full-Stack Engineer / Creative Brand Specialist"
                  value={flTitle}
                  onChange={e => setFlTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-semibold text-slate-950 outline-none focus:bg-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Professional Bio</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Briefly state your core expertise, experience, and the strategic value you provide..."
                  value={flBio}
                  onChange={e => setFlBio(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-semibold text-slate-950 outline-none resize-none focus:bg-white placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Hourly Target Rate ($)</label>
                  <input 
                    type="number" 
                    required
                    value={flHourlyRate}
                    onChange={e => setFlHourlyRate(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-bold text-slate-950 outline-none focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Skills (Comma-separated)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="React, Design, Node.js"
                    value={flSkills}
                    onChange={e => setFlSkills(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-semibold text-slate-950 outline-none focus:bg-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Portfolio Links (URLs, comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. github.com/user, behance.net/portfolio"
                  value={flPortfolio}
                  onChange={e => setFlPortfolio(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm font-semibold text-slate-950 outline-none focus:bg-white placeholder:text-slate-400"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest mt-4 transition-all shadow-md"
              >
                Onboard Talent Matrix
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {showClientOnboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-[2.5rem] space-y-6 relative shadow-2xl"
          >
            <button 
              onClick={() => setShowClientOnboard(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-955"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Onboard Hiring Client Profile</h3>
              <p className="text-slate-600 text-xs font-semibold mt-1">Provide credentials to launch open projects and secure contracts.</p>
            </div>
            
            <form onSubmit={handleOnboardClient} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Client or Company Display Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Apex Tech Ventures / John Doe Studio"
                  value={clCompanyName}
                  onChange={e => setClCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-fuchsia-500 rounded-xl text-sm font-semibold text-slate-950 outline-none focus:bg-white placeholder:text-slate-400"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-black text-xs uppercase tracking-widest mt-4 transition-all shadow-md"
              >
                Onboard Employer Node
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
