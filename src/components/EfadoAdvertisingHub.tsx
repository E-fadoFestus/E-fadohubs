import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  Home,
  LayoutList,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  Share2,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  User as UserIcon,
  Video,
  X,
} from 'lucide-react';
import {
  db,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
} from '../firebase';
import { AdListing, AdPlan, CustomAdvertCategory, UserProfile } from '../types';
import { useAI } from '../hooks/useAI';
import { useCurrency } from '../lib/CurrencyContext';
import {
  ADVERT_GROUPS,
  ADVERT_PLANS,
  ALL_SUB_CATEGORIES,
  AdvertGroupConfig,
  AdvertGroupId,
  CONTEXTUAL_FIELDS,
  findGroupForCategory,
  getCategoryLabel,
} from '../constants/advertCategories';
import {
  AdvertSubmissionInput,
  efadoAdvertApi,
  getPublicAdvertUrl,
  validateAdvertSubmission,
} from '../services/efadoAdvertApi';
import { PaymentPlatform } from './PaymentPlatform';
import { EfadoPromoKit } from './EfadoPromoKit';
import { HubGuideNote } from './HubGuideNote';
import { AdvertCard } from './AdvertCard';
import { AdvertShareBar } from './AdvertShareBar';

interface EfadoAdvertisingHubProps {
  user: UserProfile;
  onClose: () => void;
  onNavigate?: (hub: any, subview?: any) => void;
  initialType?: 'ADVERT' | 'SELL';
  initialItemId?: string;
  onOpenProfile?: () => void;
}

type HubView = 'DOOR' | 'CATEGORY_PREVIEW' | 'FORM' | 'SUCCESS' | 'MY_ADS' | 'PROMO';

async function compressAdvertPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const maxSide = 1080;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          const ratio = Math.min(maxSide / width, maxSide / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadAdvertVideo(file: File, userId: string): Promise<string> {
  if (file.size <= 420 * 1024) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error('Could not read selected video.'));
      r.onload = () => resolve(String(r.result || ''));
      r.readAsDataURL(file);
    });
  }

  const chunkSize = 350 * 1024;
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadId = `advid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  for (let i = 0; i < totalChunks; i++) {
    const slice = file.slice(i * chunkSize, (i + 1) * chunkSize);
    const chunkBase64 = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('Video upload failed while reading file.'));
      fr.onload = () => resolve(String(fr.result || ''));
      fr.readAsDataURL(slice);
    });

    const resp = await fetch('/api/uploadReelChunk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId,
        chunkIndex: i,
        totalChunks,
        chunkData: chunkBase64,
        fileName: file.name,
        mimeType: file.type || 'video/mp4',
        userId,
      }),
    });
    const data = await resp.json().catch(() => null);
    if (!resp.ok || !data?.success) {
      throw new Error(data?.error || 'Could not upload video right now.');
    }
    if (data.completed && data.videoUrl) {
      return data.videoUrl;
    }
  }
  return `/api/reels/stream/${uploadId}`;
}

export const EfadoAdvertisingHub: React.FC<EfadoAdvertisingHubProps> = ({
  user,
  onClose,
  onNavigate,
  initialType,
  initialItemId,
  onOpenProfile,
}) => {
  const { formatPrice } = useCurrency();
  const { generateImage, dailyUsage } = useAI();

  const [view, setView] = useState<HubView>(
    initialType === 'SELL' ? 'FORM' : 'DOOR'
  );
  const [adType, setAdType] = useState<'ADVERT' | 'SELL'>(initialType || 'ADVERT');
  const [selectedGroup, setSelectedGroup] = useState<AdvertGroupConfig>(ADVERT_GROUPS[0]);
  const [expandedGroupId, setExpandedGroupId] = useState<AdvertGroupId | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('BUSINESS');
  const [customOthersName, setCustomOthersName] = useState('');
  const [showOthersInput, setShowOthersInput] = useState(false);

  // Live listings & auto-promoted custom categories
  const [listings, setListings] = useState<AdListing[]>([]);
  const [promotedCustomCategories, setPromotedCustomCategories] = useState<CustomAdvertCategory[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 3-step form + review state
  const [formStep, setFormStep] = useState<1 | 2 | 3 | 4>(1);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<AdPlan>(ADVERT_PLANS[0]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    state: '',
    city: '',
    address: '',
    landmark: '',
    phone: user?.phoneNumber || '',
    whatsapp: user?.phoneNumber || '',
    email: user?.email || '',
    details: {} as Record<string, any>,
    photos: [] as string[],
    video: '',
  });
  const [mediaBusy, setMediaBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [boostingAd, setBoostingAd] = useState<AdListing | null>(null);

  // Success celebration state
  const [publishedAd, setPublishedAd] = useState<AdListing | null>(null);

  // My Adverts tab state
  const [myAdsFilter, setMyAdsFilter] = useState<'active' | 'pending' | 'finished'>('active');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [myAdsStatusMsg, setMyAdsStatusMsg] = useState<string | null>(null);
  const [shareModalAd, setShareModalAd] = useState<AdListing | null>(null);
  const [showEfadoShareModal, setShowEfadoShareModal] = useState(false);

  // Contact Seller modal state
  const [contactAd, setContactAd] = useState<AdListing | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactResult, setContactResult] = useState<string | null>(null);

  // Inline Profile Drawer fallback when no parent onOpenProfile handler
  const [showInlineProfile, setShowInlineProfile] = useState(false);

  // AI Ad Photo Generator modal
  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiAdPrompt, setAiAdPrompt] = useState('');
  const [aiGeneratedAdImg, setAiGeneratedAdImg] = useState<string | null>(null);
  const [isGeneratingAiAd, setIsGeneratingAiAd] = useState(false);
  const [aiAdError, setAiAdError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Real-time listings listener
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'ad_listings')),
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AdListing));
        docs.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setListings(docs);
        setLoadingListings(false);
      },
      () => {
        setLoadingListings(false);
      }
    );
    return () => unsub();
  }, []);

  // Real-time auto-promoted custom categories listener (5+ unique submissions)
  useEffect(() => {
    const qCats = query(collection(db, 'advert_categories'), where('promoted', '==', true));
    const unsub = onSnapshot(
      qCats,
      (snap) => {
        setPromotedCustomCategories(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomAdvertCategory))
        );
      },
      () => {}
    );
    return () => unsub();
  }, []);

  // Handle direct deep-link item selection
  useEffect(() => {
    if (!initialItemId || listings.length === 0) return;
    const lower = String(initialItemId).toLowerCase().trim();
    const match = listings.find(
      (l) => l.id.toLowerCase() === lower || String(l.slug || '').toLowerCase() === lower
    );
    if (match) {
      const grp = findGroupForCategory(match.category);
      setSelectedGroup(grp);
      setSelectedSubCategory(match.category || 'BUSINESS');
      setView('CATEGORY_PREVIEW');
      setContactAd(match);
      setContactMessage(`Hello! I saw your listing "${match.title}" on EFADO. Is it still available?`);
    }
  }, [initialItemId, listings]);

  const activeListings = useMemo(() => {
    const now = Date.now();
    return listings.filter((l) => {
      if (l.status === 'deleted' || l.status === 'finished' || l.status === 'expired') return false;
      if (l.status === 'pending') return false;
      if (l.expiryDate && l.expiryDate < now && l.status === 'active') return false;
      return true;
    });
  }, [listings]);

  const myListings = useMemo(() => {
    const uid = user?.uid;
    if (!uid) return [];
    return listings.filter((l) => l.vendorId === uid || l.userId === uid);
  }, [listings, user?.uid]);

  const filteredMyListings = useMemo(() => {
    const now = Date.now();
    return myListings.filter((l) => {
      const isExpired = Boolean(l.expiryDate && l.expiryDate < now);
      if (myAdsFilter === 'active') return l.status === 'active' && !isExpired;
      if (myAdsFilter === 'pending') return l.status === 'pending';
      return l.status === 'finished' || l.status === 'expired' || l.status === 'sold_out' || isExpired;
    });
  }, [myListings, myAdsFilter]);

  const searchResults = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return { categories: [], customCategories: [], ads: [] };

    const categories = ALL_SUB_CATEGORIES.filter(
      (c) =>
        c.label.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.keywords.some((k) => k.toLowerCase().includes(term))
    );

    const customCategories = promotedCustomCategories.filter((c) =>
      c.name.toLowerCase().includes(term)
    );

    const ads = activeListings.filter(
      (a) =>
        a.title?.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term) ||
        a.category?.toLowerCase().includes(term) ||
        a.customCategoryName?.toLowerCase().includes(term) ||
        a.location?.city?.toLowerCase().includes(term) ||
        a.location?.state?.toLowerCase().includes(term)
    );

    return { categories, customCategories, ads };
  }, [searchQuery, promotedCustomCategories, activeListings]);

  const categoryPreviewAds = useMemo(() => {
    const upper = selectedSubCategory.toUpperCase();
    const customLower = customOthersName.trim().toLowerCase();
    return activeListings.filter((a) => {
      if (customLower) {
        return (
          String(a.customCategoryName || '').toLowerCase() === customLower ||
          String(a.category || '').toLowerCase() === customLower
        );
      }
      if (a.category?.toUpperCase() === upper) return true;
      if (a.groupId === selectedGroup.id && !ALL_SUB_CATEGORIES.some((s) => s.id === upper)) {
        return true;
      }
      return false;
    });
  }, [activeListings, selectedSubCategory, customOthersName, selectedGroup.id]);

  const resetForm = (nextType: 'ADVERT' | 'SELL' = adType) => {
    setEditingAdId(null);
    setFormError(null);
    setFormStep(1);
    setSelectedPlan(ADVERT_PLANS[0]);
    setAdType(nextType);
    setFormData({
      title: '',
      description: '',
      price: '',
      state: '',
      city: '',
      address: '',
      landmark: '',
      phone: user?.phoneNumber || '',
      whatsapp: user?.phoneNumber || '',
      email: user?.email || '',
      details: {},
      photos: [],
      video: '',
    });
  };

  const startWizard = (mode: 'ADVERT' | 'SELL', group: AdvertGroupConfig, subCatId: string, customName = '') => {
    setAdType(mode);
    setSelectedGroup(group);
    setSelectedSubCategory(subCatId);
    setCustomOthersName(customName);
    resetForm(mode);
    setView('FORM');
  };

  const openCategoryPreview = (group: AdvertGroupConfig, subCatId: string, customName = '') => {
    setSelectedGroup(group);
    setSelectedSubCategory(subCatId);
    setCustomOthersName(customName);
    setView('CATEGORY_PREVIEW');
  };

  const openEditAd = (ad: AdListing) => {
    const grp = findGroupForCategory(ad.category);
    setEditingAdId(ad.id);
    setAdType(ad.type || 'ADVERT');
    setSelectedGroup(grp);
    setSelectedSubCategory(grp.id === 'OTHERS' ? 'OTHER' : ad.category);
    setCustomOthersName(ad.customCategoryName || (grp.id === 'OTHERS' ? ad.category : ''));
    setFormData({
      title: ad.title || '',
      description: ad.description || '',
      price: String(ad.price ?? ''),
      state: ad.location?.state || '',
      city: ad.location?.city || '',
      address: ad.location?.address || '',
      landmark: ad.location?.landmark || '',
      phone: ad.contact?.phone || '',
      whatsapp: ad.contact?.whatsapp || '',
      email: ad.contact?.email || '',
      details: ad.details || {},
      photos: Array.isArray(ad.photos) ? ad.photos : [],
      video: ad.video || '',
    });
    const matchedPlan = ADVERT_PLANS.find((p) => p.id === ad.plan) || ADVERT_PLANS[0];
    setSelectedPlan(matchedPlan);
    setFormStep(1);
    setFormError(null);
    setView('FORM');
  };

  const handlePhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remainingSlots = Math.max(0, 4 - formData.photos.length);
    if (remainingSlots === 0) {
      setFormError('You already added 4 photos (maximum allowed).');
      return;
    }
    setMediaBusy(true);
    setFormError(null);
    try {
      const selected = Array.from(files).slice(0, remainingSlots);
      const compressed = await Promise.all(selected.map((f) => compressAdvertPhoto(f)));
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...compressed].slice(0, 4),
      }));
    } catch (err: any) {
      setFormError(err?.message || 'Could not process one of the selected photos.');
    } finally {
      setMediaBusy(false);
      e.target.value = '';
    }
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setFormError('Video file is too big. Please choose a clip under 25MB.');
      return;
    }
    setMediaBusy(true);
    setFormError(null);
    try {
      const url = await uploadAdvertVideo(file, user.uid);
      setFormData((prev) => ({ ...prev, video: url }));
    } catch (err: any) {
      setFormError(err?.message || 'Not sent, please try again.');
    } finally {
      setMediaBusy(false);
      e.target.value = '';
    }
  };

  const handleNextStep = () => {
    setFormError(null);
    if (formStep === 1) {
      if (formData.title.trim().length < 3) {
        setFormError('Please enter a clear name for what you are promoting or selling.');
        return;
      }
      const priceVal = Number(formData.price === '' ? 0 : formData.price);
      if (!Number.isFinite(priceVal) || priceVal < 0) {
        setFormError('Please enter a valid price (or 0 if price depends on choice).');
        return;
      }
      if (selectedGroup.id === 'OTHERS' && !customOthersName.trim()) {
        setFormError('Please write what you want to advertise in your own words.');
        return;
      }
      setFormStep(2);
      return;
    }
    if (formStep === 2) {
      if (formData.state.trim().length < 2 || formData.city.trim().length < 2 || formData.address.trim().length < 3) {
        setFormError('Please enter the State, Town / City, and Full Address.');
        return;
      }
      setFormStep(3);
      return;
    }
    if (formStep === 3) {
      if (formData.photos.length === 0) {
        setFormError('Please add at least 1 photo so buyers can see your offer clearly.');
        return;
      }
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 7) {
        setFormError('Please enter a valid phone number so buyers can reach you.');
        return;
      }
      setFormStep(4);
    }
  };

  const commitAdvertSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const numericPrice = Number(formData.price === '' ? 0 : formData.price);
      const submission: AdvertSubmissionInput = {
        type: adType,
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: numericPrice,
        category: selectedGroup.id === 'OTHERS' && customOthersName.trim() ? customOthersName.trim() : selectedSubCategory,
        groupId: selectedGroup.id,
        customCategoryName: customOthersName.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        address: formData.address.trim(),
        landmark: formData.landmark.trim(),
        phone: formData.phone.trim(),
        whatsapp: (formData.whatsapp || formData.phone).trim(),
        email: formData.email.trim(),
        details: formData.details,
        photos: formData.photos.slice(0, 4),
        video: formData.video,
        plan: selectedPlan,
      };

      const invalid = validateAdvertSubmission(submission);
      if (invalid) {
        setFormError(invalid);
        setIsSubmitting(false);
        return;
      }

      if (editingAdId) {
        await efadoAdvertApi.updateAdvert(editingAdId, user.uid, {
          type: submission.type,
          title: submission.title,
          description:
            submission.description ||
            `${submission.title} available in ${submission.city}, ${submission.state}.`,
          price: submission.price,
          category: submission.category,
          groupId: submission.groupId,
          customCategoryName: submission.customCategoryName,
          location: {
            state: submission.state,
            city: submission.city,
            address: submission.address,
            landmark: submission.landmark,
          },
          contact: {
            phone: submission.phone,
            whatsapp: submission.whatsapp,
            email: submission.email,
          },
          details: submission.details,
          photos: submission.photos,
          video: submission.video,
        });
        const updatedExisting = listings.find((l) => l.id === editingAdId);
        setPublishedAd(
          updatedExisting
            ? {
                ...updatedExisting,
                title: submission.title,
                price: submission.price,
                location: { state: submission.state, city: submission.city, address: submission.address },
              }
            : null
        );
        setEditingAdId(null);
        setMyAdsStatusMsg('Your advert changes have been saved.');
        setView('MY_ADS');
      } else {
        const created = await efadoAdvertApi.createAdvert(user, submission);
        setPublishedAd(created);
        setView('SUCCESS');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Not sent, please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = () => {
    setFormError(null);
    if (!editingAdId && selectedPlan.price > 0) {
      setBoostingAd(null);
      setShowPayment(true);
      return;
    }
    void commitAdvertSave();
  };

  const handleDeleteAdvert = async (adId: string) => {
    setMyAdsStatusMsg(null);
    try {
      await efadoAdvertApi.deleteAdvert(adId, user.uid);
      setConfirmDeleteId(null);
      setMyAdsStatusMsg('Advert deleted.');
    } catch (err: any) {
      setMyAdsStatusMsg(err?.message || 'Not sent, please try again.');
    }
  };

  const handleSendContactInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactAd || !contactMessage.trim()) return;
    setContactSending(true);
    setContactResult(null);
    try {
      const targetUserId = contactAd.vendorId || contactAd.userId;
      if (targetUserId) {
        await addDoc(collection(db, 'efado_notifications'), {
          userId: targetUserId,
          senderId: user?.uid || 'guest',
          senderName: user?.fullName || user?.displayName || 'Interested Buyer',
          senderPhone: user?.phoneNumber || '',
          hub: 'ADVERTISING',
          type: 'ADVERT_INQUIRY',
          title: `New message on "${contactAd.title}"`,
          message: contactMessage.trim(),
          link: `/advert/${contactAd.slug || contactAd.id}`,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }
      setContactResult('Your message was sent to the seller!');
      setContactMessage('');
    } catch {
      setContactResult('Not sent, please try again.');
    } finally {
      setContactSending(false);
    }
  };

  const activeCategoryFields =
    CONTEXTUAL_FIELDS[selectedSubCategory] || CONTEXTUAL_FIELDS.OTHER;

  const activeCategoryTitle =
    selectedGroup.id === 'OTHERS' && customOthersName.trim()
      ? customOthersName.trim()
      : getCategoryLabel(selectedSubCategory, customOthersName);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-white text-slate-900 overflow-y-auto custom-scrollbar"
    >
      {/* Clean White Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {view !== 'DOOR' ? (
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setView('DOOR');
                }}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Promote or Sell on EFADO
              </h1>
              <p className="text-xs text-slate-600">
                Simple steps to reach buyers across EFADO, WhatsApp, and web search
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEfadoShareModal(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share EFADO</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAiImageModal(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Ad Photo</span>
            </button>

            <button
              type="button"
              onClick={() => setView(view === 'PROMO' ? 'DOOR' : 'PROMO')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer ${
                view === 'PROMO'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-200'
              }`}
            >
              {view === 'PROMO' ? 'Back to Hub' : 'Promo Materials'}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Promote or Sell page"
              className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container (padded at bottom so persistent bar never covers buttons) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 space-y-8">
        <HubGuideNote
          guideId="advertising"
          variant="light"
        />

        {/* ==================== 1. ONE DOOR + SEARCH + 6 GROUPS ==================== */}
        {view === 'DOOR' && (
          <div className="space-y-8">
            {/* One Door Intro Card */}
            <section className="p-6 sm:p-8 rounded-3xl bg-purple-50/70 border border-purple-200 space-y-6">
              <div className="space-y-2 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Promote or Sell on EFADO
                </h2>
                <p className="text-base sm:text-lg font-medium text-slate-700">
                  What do you want to do today?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => startWizard('ADVERT', ADVERT_GROUPS[0], 'BUSINESS')}
                  className="p-6 rounded-2xl bg-white hover:bg-sky-50 border-2 border-indigo-300 text-left flex flex-col justify-between gap-3 shadow-sm transition-all cursor-pointer h-full"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                      <Megaphone className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold">
                      Advertise
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      I want many people to see my business
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <strong>Advertise means:</strong> Pay to promote your business so many people can see it.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => startWizard('SELL', ADVERT_GROUPS[0], 'BUSINESS')}
                  className="p-6 rounded-2xl bg-white hover:bg-pink-50 border-2 border-rose-300 text-left flex flex-col justify-between gap-3 shadow-sm transition-all cursor-pointer h-full"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold">
                      Sell Now
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                      I want to sell something now
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <strong>Sell means:</strong> List your product so someone can buy it from you.
                    </p>
                  </div>
                </button>
              </div>
            </section>

            {/* Top Search Bar */}
            <section className="space-y-4">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search what you want to buy, sell, or promote (e.g. land, phones, salon, goat farming)..."
                  className="w-full min-h-[52px] pl-12 pr-12 py-3 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-2xl text-base text-slate-900 placeholder:text-slate-500 outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Live Search Results */}
              {searchQuery.trim() && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                  <h3 className="text-base font-bold text-slate-900">
                    Search results for &ldquo;{searchQuery.trim()}&rdquo;
                  </h3>

                  {(searchResults.categories.length > 0 || searchResults.customCategories.length > 0) && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600">Matching Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {searchResults.categories.map((cat) => {
                          const grp = ADVERT_GROUPS.find((g) => g.id === cat.groupId) || ADVERT_GROUPS[0];
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => openCategoryPreview(grp, cat.id)}
                              className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer ${grp.cardBg} ${grp.cardBorder} ${grp.accentText}`}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                        {searchResults.customCategories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => openCategoryPreview(ADVERT_GROUPS[5], 'OTHER', c.name)}
                            className="min-h-[44px] px-4 py-2 rounded-xl border bg-indigo-50 border-indigo-200 text-indigo-900 text-sm font-semibold cursor-pointer"
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.ads.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-600">
                        Live Listings ({searchResults.ads.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {searchResults.ads.map((ad) => (
                          <AdvertCard
                            key={ad.id}
                            ad={ad}
                            user={user}
                            onContact={(target) => {
                              setContactAd(target);
                              setContactResult(null);
                              setContactMessage(`Hello! I saw "${target.title}" on EFADO. Is it available?`);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    searchResults.categories.length === 0 &&
                    searchResults.customCategories.length === 0 && (
                      <div className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-base font-bold text-slate-900">
                            No existing category matched &ldquo;{searchQuery.trim()}&rdquo;
                          </p>
                          <p className="text-sm text-slate-600">
                            You can promote or sell anything under Others right away.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            startWizard('ADVERT', ADVERT_GROUPS[5], 'OTHER', searchQuery.trim())
                          }
                          className="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shrink-0 cursor-pointer"
                        >
                          Advertise &ldquo;{searchQuery.trim()}&rdquo;
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            {/* Auto-Promoted Popular Custom Categories (5+ unique users) */}
            {promotedCustomCategories.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-base font-bold text-slate-900">
                  Popular Member Categories
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {promotedCustomCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openCategoryPreview(ADVERT_GROUPS[5], 'OTHER', c.name)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-sm font-semibold cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 5 Grouped Categories + 6th Others */}
            <section className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Choose a Category
                </h3>
                <p className="text-sm sm:text-base text-slate-600">
                  Pick a group to see real listings inside it, or write your own under Others.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {ADVERT_GROUPS.map((group) => {
                  const isExpanded = expandedGroupId === group.id;
                  return (
                    <div
                      key={group.id}
                      className={`rounded-2xl border ${group.cardBg} ${group.cardBorder} overflow-hidden flex flex-col justify-between h-full shadow-sm`}
                    >
                      <div>
                        <div className="aspect-[4/3] w-full overflow-hidden bg-white">
                          <img
                            src={group.image}
                            alt={group.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-5 space-y-2">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${group.pillBg}`}>
                            Category {group.number}
                          </span>
                          <h4 className={`text-lg font-bold leading-snug ${group.accentText}`}>
                            {group.title}
                          </h4>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {group.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 space-y-3">
                        {group.id === 'OTHERS' ? (
                          <button
                            type="button"
                            onClick={() => setShowOthersInput((prev) => !prev)}
                            className="w-full min-h-[46px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Write What You Want to Advertise</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedGroupId(isExpanded ? null : group.id)
                            }
                            className="w-full min-h-[46px] px-4 py-2.5 bg-white hover:bg-slate-900 hover:text-white text-slate-900 border border-slate-300 rounded-xl text-sm font-semibold flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span>{isExpanded ? 'Hide Options' : 'See Options Inside'}</span>
                            <ChevronRight
                              className={`w-4 h-4 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                        )}

                        {/* Sub-items for groups 1-5 */}
                        {group.id !== 'OTHERS' && isExpanded && (
                          <div className="space-y-2 pt-1">
                            {group.subCategories.map((sub) => (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => openCategoryPreview(group, sub.id)}
                                className="w-full p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left flex items-center justify-between gap-2 cursor-pointer"
                              >
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{sub.label}</p>
                                  <p className="text-xs text-slate-600">{sub.description}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 6th Group: "Others - Advertise Something Different" Unlimited Prompt */}
              {showOthersInput && (
                <div className="p-6 sm:p-7 rounded-2xl bg-indigo-50 border-2 border-indigo-300 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-lg sm:text-xl font-bold text-indigo-950">
                      What do you want to advertise? Write the name in your own words.
                    </h4>
                    <p className="text-sm text-indigo-900">
                      Examples: Goat Farming, Catering Training, Car Wash Machine, Home Tutoring, Solar Borehole.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={customOthersName}
                      onChange={(e) => setCustomOthersName(e.target.value)}
                      placeholder="Write your category or business type here..."
                      className="flex-1 min-h-[48px] px-4 py-3 bg-white border border-indigo-200 focus:border-indigo-600 rounded-xl text-base text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = customOthersName.trim();
                        if (!clean) return;
                        startWizard('ADVERT', ADVERT_GROUPS[5], 'OTHER', clean);
                      }}
                      disabled={!customOthersName.trim()}
                      className="min-h-[48px] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Step 1</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Recent Live Listings Feed */}
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Recent Live Adverts &amp; Products
                  </h3>
                  <p className="text-sm text-slate-600">
                    Real listings shared by EFADO members right now
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startWizard('SELL', ADVERT_GROUPS[0], 'BUSINESS')}
                  className="min-h-[44px] px-5 py-2.5 bg-slate-900 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Yours Now</span>
                </button>
              </div>

              {loadingListings ? (
                <div className="p-10 text-center text-slate-600 bg-slate-50 rounded-2xl border border-slate-200">
                  Loading live adverts...
                </div>
              ) : activeListings.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <p className="text-base font-bold text-slate-900">No active adverts in this view yet</p>
                  <p className="text-sm text-slate-600">Be the first person to post your business or product today.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeListings.slice(0, 12).map((ad) => (
                    <AdvertCard
                      key={ad.id}
                      ad={ad}
                      user={user}
                      onContact={(target) => {
                        setContactAd(target);
                        setContactResult(null);
                        setContactMessage(`Hello! I saw "${target.title}" on EFADO. Is it available?`);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ==================== 2. CATEGORY PREVIEW VIEW ==================== */}
        {view === 'CATEGORY_PREVIEW' && (
          <div className="space-y-6">
            <div className={`p-6 sm:p-8 rounded-3xl border ${selectedGroup.cardBg} ${selectedGroup.cardBorder} flex flex-col md:flex-row md:items-center justify-between gap-5`}>
              <div className="space-y-1.5">
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${selectedGroup.pillBg}`}>
                  {selectedGroup.title}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {activeCategoryTitle}
                </h2>
                <p className="text-sm sm:text-base text-slate-700">
                  See how existing adverts look in this category, then post yours in 3 easy steps.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  startWizard(adType, selectedGroup, selectedSubCategory, customOthersName)
                }
                className="min-h-[50px] px-6 py-3 bg-slate-900 hover:bg-indigo-700 text-white rounded-xl text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                <span>Advertise Like This - Start Here</span>
              </button>
            </div>

            {categoryPreviewAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {categoryPreviewAds.map((ad) => (
                  <AdvertCard
                    key={ad.id}
                    ad={ad}
                    user={user}
                    onContact={(target) => {
                      setContactAd(target);
                      setContactResult(null);
                      setContactMessage(`Hello! I saw "${target.title}" on EFADO. Is it available?`);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="p-10 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  No adverts posted in &ldquo;{activeCategoryTitle}&rdquo; yet
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your advert will appear right at the top when people open this category.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    startWizard(adType, selectedGroup, selectedSubCategory, customOthersName)
                  }
                  className="min-h-[46px] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Advertise Like This - Start Here
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. SIMPLE 3-STEP FORM + REVIEW ==================== */}
        {view === 'FORM' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Step Progress Strip */}
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-purple-800 uppercase tracking-wide">
                    {editingAdId
                      ? 'Edit Your Advert'
                      : formStep === 4
                      ? 'Final Check Before Publishing'
                      : `Step ${formStep} of 3`}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                    {formStep === 1 &&
                      (adType === 'SELL' ? 'What are you selling?' : 'What do you want to promote?')}
                    {formStep === 2 && 'Where is it?'}
                    {formStep === 3 && 'Photos, video, and contact'}
                    {formStep === 4 && 'Review and confirm'}
                  </h2>
                </div>

                {/* Quick mode toggle */}
                {!editingAdId && (
                  <div className="flex rounded-xl bg-white border border-purple-200 p-1">
                    <button
                      type="button"
                      onClick={() => setAdType('ADVERT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        adType === 'ADVERT' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Advertise
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdType('SELL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        adType === 'SELL' ? 'bg-rose-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      Sell
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-2 rounded-full transition-colors ${
                      formStep >= s ? 'bg-indigo-600' : 'bg-purple-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {formError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
                {formError}
              </div>
            )}

            {/* STEP 1: WHAT ARE YOU SELLING? */}
            {formStep === 1 && (
              <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-800 block">
                      Category Group
                    </label>
                    <select
                      value={selectedGroup.id}
                      onChange={(e) => {
                        const grp =
                          ADVERT_GROUPS.find((g) => g.id === e.target.value) || ADVERT_GROUPS[0];
                        setSelectedGroup(grp);
                        setSelectedSubCategory(grp.subCategories[0]?.id || 'OTHER');
                        setFormData((prev) => ({ ...prev, details: {} }));
                      }}
                      className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-500"
                    >
                      {ADVERT_GROUPS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedGroup.id === 'OTHERS' ? (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-800 block">
                        Write What You Are Promoting
                      </label>
                      <input
                        type="text"
                        value={customOthersName}
                        onChange={(e) => setCustomOthersName(e.target.value)}
                        placeholder="e.g. Goat Farming, Catering Training"
                        className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-800 block">
                        Specific Kind
                      </label>
                      <select
                        value={selectedSubCategory}
                        onChange={(e) => {
                          setSelectedSubCategory(e.target.value);
                          setFormData((prev) => ({ ...prev, details: {} }));
                        }}
                        className="w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-500"
                      >
                        {selectedGroup.subCategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800 block">
                    {adType === 'SELL' ? 'Item Name' : 'Business or Offer Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={
                      adType === 'SELL'
                        ? 'e.g. Fresh Broilers, iPhone 13 Pro, 2-Bedroom Flat'
                        : 'e.g. Grace Catering & Pastries, Sunrise Solar Repairs'
                    }
                    className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800 block">
                    Price (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 15000 (enter 0 if price depends on order)"
                    className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Contextual Fields Matching Selected Item */}
                {activeCategoryFields.length > 0 && (
                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-4">
                    <p className="text-sm font-bold text-sky-950">
                      Helpful details for {activeCategoryTitle}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeCategoryFields.map((field) => (
                        <div key={field.key} className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 block">
                            {field.label} {field.optional ? '(Optional)' : ''}
                          </label>
                          {field.type === 'select' && field.options ? (
                            <select
                              value={formData.details[field.key] || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  details: { ...formData.details, [field.key]: e.target.value },
                                })
                              }
                              className="w-full min-h-[44px] px-3 py-2 bg-white border border-sky-200 rounded-xl text-sm text-slate-900 outline-none"
                            >
                              <option value="">{field.placeholder}</option>
                              {field.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === 'date' ? 'date' : 'text'}
                              value={formData.details[field.key] || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  details: { ...formData.details, [field.key]: e.target.value },
                                })
                              }
                              placeholder={field.placeholder}
                              className="w-full min-h-[44px] px-3 py-2 bg-white border border-sky-200 rounded-xl text-sm text-slate-900 outline-none"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800 block">
                    Short Description (Tell buyers why they should choose yours)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Write clear details buyers should know..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="min-h-[48px] px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: Where is it?</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: WHERE IS IT? */}
            {formStep === 2 && (
              <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 space-y-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-800 block">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. Lagos, Oyo, Abuja"
                      className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-800 block">
                      Town / City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Ikeja, Bodija, Wuse"
                      className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800 block">
                    Full Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street name, market area, or estate"
                    className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-800 block">
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="e.g. Opposite Total Filling Station"
                    className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    className="min-h-[48px] px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="min-h-[48px] px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: Photos &amp; Contact</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PHOTOS, VIDEO & CONTACT */}
            {formStep === 3 && (
              <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 space-y-6 shadow-sm">
                {/* Photos */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Photos (Add 1 to 4 clear photos)
                      </h3>
                      <p className="text-xs text-slate-600">
                        {formData.photos.length} of 4 added
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAiImageModal(true)}
                      className="min-h-[40px] px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Make Photo with AI</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoFiles}
                    className="hidden"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formData.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={photo}
                          alt={`Selected photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              photos: prev.photos.filter((_, i) => i !== idx),
                            }))
                          }
                          aria-label="Remove photo"
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {formData.photos.length < 4 && (
                      <button
                        type="button"
                        disabled={mediaBusy}
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[4/3] rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-900 flex flex-col items-center justify-center gap-1.5 p-3 cursor-pointer"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="text-xs font-semibold">
                          {mediaBusy ? 'Adding...' : 'Add Photo'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional Video / Reel */}
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-orange-950">
                        Optional Short Video or Reel
                      </h4>
                      <p className="text-xs text-orange-900">
                        If you add a video, it will also show automatically inside EFADO Reels.
                      </p>
                    </div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={mediaBusy}
                      onClick={() => videoInputRef.current?.click()}
                      className="min-h-[42px] px-4 py-2 bg-white hover:bg-orange-100 border border-orange-300 text-orange-950 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>{formData.video ? 'Change Video' : 'Add Video'}</span>
                    </button>
                  </div>

                  {formData.video && (
                    <div className="flex items-center justify-between gap-3 bg-white border border-orange-200 rounded-xl p-3">
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Video ready to show in your advert and EFADO Reels
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, video: '' }))}
                        className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Phone & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-800 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 08031234567"
                      className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-800">
                        WhatsApp Number
                      </label>
                      {formData.phone && formData.whatsapp !== formData.phone && (
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, whatsapp: p.phone }))}
                          className="text-xs font-semibold text-indigo-700 hover:underline cursor-pointer"
                        >
                          Same as Phone
                        </button>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="e.g. 08031234567"
                      className="w-full min-h-[48px] px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Visibility Plan Selection */}
                {!editingAdId && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <h4 className="text-base font-bold text-slate-900">
                      Choose How Long Your Advert Runs
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ADVERT_PLANS.map((plan) => {
                        const active = selectedPlan.id === plan.id;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlan(plan)}
                            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                              active
                                ? 'bg-indigo-50 border-indigo-600'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-sm text-slate-900">{plan.name}</span>
                              <span className="font-bold text-base text-indigo-800">
                                {plan.price === 0 ? 'Free' : formatPrice(plan.price)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {plan.features.join(' • ')}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFormStep(2)}
                    className="min-h-[48px] px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="min-h-[48px] px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Preview &amp; Check Price</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PRE-PAYMENT REVIEW CARD */}
            {formStep === 4 && (
              <div className="space-y-6">
                <div className="p-6 sm:p-7 rounded-2xl bg-green-50 border border-green-200 space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">
                      This is how your advert will look
                    </h3>
                    <p className="text-sm text-slate-700">
                      You can edit it after you publish.
                    </p>
                  </div>

                  {/* Preview Card */}
                  <div className="max-w-sm bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="aspect-[4/3] bg-slate-100">
                      {formData.photos[0] && (
                        <img
                          src={formData.photos[0]}
                          alt={formData.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-5 space-y-2">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${selectedGroup.pillBg}`}>
                        {activeCategoryTitle}
                      </span>
                      <h4 className="text-lg font-bold text-slate-900">{formData.title}</h4>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {formData.description || `${formData.title} available in ${formData.city}, ${formData.state}.`}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{formData.city}, {formData.state}</span>
                      </p>
                      <p className="text-lg font-bold text-slate-900 pt-2 border-t border-slate-100">
                        {Number(formData.price || 0) > 0
                          ? formatPrice(Number(formData.price))
                          : 'Ask Seller'}
                      </p>
                    </div>
                  </div>

                  {/* Who will see it & How much it costs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white border border-green-200 space-y-1">
                      <p className="text-xs font-bold text-emerald-800 uppercase">
                        This is who will see it
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        People browsing EFADO Home, searching by keyword, opening your category, watching Reels (if you added video), and anyone opening your public share link on WhatsApp or Google.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-green-200 space-y-1">
                      <p className="text-xs font-bold text-emerald-800 uppercase">
                        This is how much it will cost
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {editingAdId
                          ? 'Free Edit (₦0)'
                          : selectedPlan.price === 0
                          ? 'Free (₦0)'
                          : formatPrice(selectedPlan.price)}
                      </p>
                      <p className="text-xs text-slate-600">
                        {editingAdId ? 'Saving changes to your live advert' : selectedPlan.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setFormStep(3)}
                    className="min-h-[48px] px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleReviewSubmit}
                    className="min-h-[50px] px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-base font-semibold cursor-pointer"
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : editingAdId
                      ? 'Save Changes'
                      : selectedPlan.price > 0
                      ? `Pay ${formatPrice(selectedPlan.price)} & Publish`
                      : 'Publish Advert Now'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. POST-PUBLISH CELEBRATION ==================== */}
        {view === 'SUCCESS' && publishedAd && (
          <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Your advert is live! Now let people see it.
                </h2>
                <p className="text-base text-slate-700">
                  <strong>{publishedAd.title}</strong> is now live on EFADO and has its own public link:
                </p>
                <a
                  href={`/advert/${publishedAd.slug || publishedAd.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-semibold text-indigo-700 hover:underline break-all"
                >
                  {getPublicAdvertUrl(publishedAd)}
                </a>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-emerald-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Share Your Advert Anywhere (7 Ways)
              </h3>
              <AdvertShareBar ad={publishedAd} />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setView('MY_ADS')}
                className="min-h-[46px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold cursor-pointer"
              >
                Go to My Adverts
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm('ADVERT');
                  setView('DOOR');
                }}
                className="min-h-[46px] px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Back to Categories
              </button>
            </div>
          </div>
        )}

        {/* ==================== 5. MY ADVERTS ==================== */}
        {view === 'MY_ADS' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">My Adverts</h2>
                <p className="text-sm text-slate-600">
                  See views and shares, edit details, boost visibility, or share again.
                </p>
              </div>
              <button
                type="button"
                onClick={() => startWizard('ADVERT', ADVERT_GROUPS[0], 'BUSINESS')}
                className="min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Advert</span>
              </button>
            </div>

            {myAdsStatusMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold">
                {myAdsStatusMsg}
              </div>
            )}

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'active', label: 'Active' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'finished', label: 'Finished' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMyAdsFilter(tab.id)}
                  className={`min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold border cursor-pointer ${
                    myAdsFilter === tab.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredMyListings.length === 0 ? (
              <div className="p-10 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <p className="text-base font-bold text-slate-900">
                  No {myAdsFilter} adverts right now
                </p>
                <p className="text-sm text-slate-600">
                  When you publish an advert or sell an item, you can manage it right here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredMyListings.map((ad) => (
                  <div
                    key={ad.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <img
                        src={ad.photos?.[0] || findGroupForCategory(ad.category).image}
                        alt={ad.title}
                        className="w-24 h-24 rounded-xl object-cover bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-900 text-xs font-semibold">
                          {getCategoryLabel(ad.category, ad.customCategoryName)}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 truncate">{ad.title}</h3>
                        <p className="text-sm font-bold text-slate-900">
                          {Number(ad.price || 0) > 0 ? formatPrice(ad.price) : 'Ask Seller'}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> {Number(ad.viewsCount || 0)} views
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Share2 className="w-3.5 h-3.5" /> {Number(ad.sharesCount || 0)} shares
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openEditAd(ad)}
                        className="min-h-[42px] px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBoostingAd(ad);
                          setSelectedPlan(ADVERT_PLANS[1]);
                          setShowPayment(true);
                        }}
                        className="min-h-[42px] px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> Boost
                      </button>

                      <button
                        type="button"
                        onClick={() => setShareModalAd(ad)}
                        className="min-h-[42px] px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share Again
                      </button>

                      {confirmDeleteId === ad.id ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteAdvert(ad.id)}
                          className="min-h-[42px] px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(ad.id)}
                          className="min-h-[42px] px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== 6. PROMO MATERIALS ==================== */}
        {view === 'PROMO' && <EfadoPromoKit user={user} onClose={() => setView('DOOR')} />}
      </main>

      {/* ==================== PERSISTENT BOTTOM NAVIGATION BAR ==================== */}
      <nav
        aria-label="Advert and Sell Navigation"
        className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 shadow-lg"
      >
        <div className="max-w-3xl mx-auto grid grid-cols-5 gap-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[46px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdType('ADVERT');
              setView('DOOR');
            }}
            className={`min-h-[46px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold cursor-pointer ${
              (view === 'DOOR' || view === 'CATEGORY_PREVIEW' || (view === 'FORM' && adType === 'ADVERT'))
                ? 'bg-purple-100 text-purple-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Advertise</span>
          </button>

          <button
            type="button"
            onClick={() => startWizard('SELL', ADVERT_GROUPS[0], 'BUSINESS')}
            className={`min-h-[46px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold cursor-pointer ${
              view === 'FORM' && adType === 'SELL'
                ? 'bg-rose-100 text-rose-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Sell</span>
          </button>

          <button
            type="button"
            onClick={() => setView('MY_ADS')}
            className={`min-h-[46px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold cursor-pointer ${
              view === 'MY_ADS'
                ? 'bg-sky-100 text-sky-900'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>My Adverts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenProfile) {
                onOpenProfile();
              } else {
                setShowInlineProfile(true);
              }
            }}
            className="min-h-[46px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <UserIcon className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {/* ==================== PAID ADVERT PAYMENT WRAPPER (ABOVE HUB Z-INDEX) ==================== */}
      <AnimatePresence>
        {showPayment && selectedPlan && (
          <div className="fixed inset-0 z-[120]">
            <PaymentPlatform
              user={user}
              type="deposit"
              amount={selectedPlan.price}
              purpose={
                boostingAd
                  ? `Boost Advert: ${boostingAd.title} (${selectedPlan.name})`
                  : `Ad Plan: ${selectedPlan.name}`
              }
              hub="ADVERTISING"
              onSuccess={async () => {
                setShowPayment(false);
                if (boostingAd) {
                  try {
                    await efadoAdvertApi.boostAdvert(boostingAd.id, user.uid, selectedPlan);
                    setMyAdsStatusMsg(`"${boostingAd.title}" was boosted for ${selectedPlan.durationDays} days.`);
                  } catch (err: any) {
                    setMyAdsStatusMsg(err?.message || 'Not sent, please try again.');
                  } finally {
                    setBoostingAd(null);
                  }
                } else {
                  await commitAdvertSave();
                }
              }}
              onCancel={() => {
                setShowPayment(false);
                setBoostingAd(null);
              }}
              onClose={() => {
                setShowPayment(false);
                setBoostingAd(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ==================== CONTACT SELLER MODAL ==================== */}
      <AnimatePresence>
        {contactAd && (
          <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900">
                    {getCategoryLabel(contactAd.category, contactAd.customCategoryName)}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">{contactAd.title}</h3>
                  <p className="text-base font-bold text-indigo-700 mt-0.5">
                    {Number(contactAd.price || 0) > 0 ? formatPrice(contactAd.price) : 'Ask Seller'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContactAd(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contactAd.contact?.phone && (
                  <a
                    href={`tel:${contactAd.contact.phone}`}
                    className="min-h-[48px] px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> Call {contactAd.contact.phone}
                  </a>
                )}
                {contactAd.contact?.whatsapp && (
                  <a
                    href={`https://wa.me/${contactAd.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! I saw "${contactAd.title}" on EFADO (${getPublicAdvertUrl(contactAd)}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[48px] px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp Seller
                  </a>
                )}
              </div>

              <form onSubmit={handleSendContactInquiry} className="space-y-3">
                <label className="text-sm font-semibold text-slate-800 block">
                  Send a Message on EFADO
                </label>
                <textarea
                  rows={3}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Write your question for the seller..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-500 resize-none"
                />
                {contactResult && (
                  <p className="text-sm font-semibold text-emerald-700">{contactResult}</p>
                )}
                <button
                  type="submit"
                  disabled={contactSending || !contactMessage.trim()}
                  className="w-full min-h-[46px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{contactSending ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== SHARE AGAIN MODAL ==================== */}
      <AnimatePresence>
        {shareModalAd && (
          <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Share &ldquo;{shareModalAd.title}&rdquo;
                </h3>
                <button
                  type="button"
                  onClick={() => setShareModalAd(null)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <AdvertShareBar ad={shareModalAd} />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== TOP "SHARE EFADO" MODAL ==================== */}
      <AnimatePresence>
        {showEfadoShareModal && (
          <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Share EFADO With Friends</h3>
                  <p className="text-xs text-slate-600">
                    Invite buyers and business owners to EFADO Promote or Sell
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEfadoShareModal(false)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <AdvertShareBar
                ad={{
                  id: 'efado-platform',
                  slug: 'efado-platform',
                  title: 'Promote or Sell on EFADO',
                  price: 0,
                  location: { city: 'Lagos', state: 'Nigeria', address: 'EFADO Hubs Connect' },
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== INLINE PROFILE FALLBACK MODAL ==================== */}
      <AnimatePresence>
        {showInlineProfile && (
          <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">My Account</h3>
                <button
                  type="button"
                  onClick={() => setShowInlineProfile(false)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1">
                <p className="text-base font-bold text-slate-900">
                  {user?.fullName || user?.displayName || 'EFADO Member'}
                </p>
                <p className="text-xs text-slate-700">{user?.email || user?.phoneNumber}</p>
                <p className="text-sm font-semibold text-indigo-800 pt-2">
                  Deposit Wallet: {formatPrice(user?.depositWallet || 0)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineProfile(false);
                    setView('MY_ADS');
                  }}
                  className="flex-1 min-h-[44px] bg-slate-900 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  My Adverts ({myListings.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInlineProfile(false);
                    onNavigate?.('DASHBOARD');
                  }}
                  className="flex-1 min-h-[44px] bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Open Wallet
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== AI AD PHOTO GENERATOR MODAL ==================== */}
      <AnimatePresence>
        {showAiImageModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-lg w-full bg-white border border-purple-200 rounded-3xl p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">AI Ad Photo Generator</h3>
                    <p className="text-xs text-slate-600">{dailyUsage.usageText}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiImageModal(false)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {aiAdError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
                  {aiAdError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800 block">
                  Describe the photo you want to create
                </label>
                <textarea
                  value={aiAdPrompt}
                  onChange={(e) => setAiAdPrompt(e.target.value)}
                  placeholder="e.g. Clean leather shoes displayed neatly on a bright wooden table"
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!aiAdPrompt.trim()) return;
                  setIsGeneratingAiAd(true);
                  setAiAdError(null);
                  const res = await generateImage(aiAdPrompt);
                  if (res.success && res.imageUrl) {
                    setAiGeneratedAdImg(res.imageUrl);
                  } else {
                    setAiAdError(res.error || 'Could not create photo right now.');
                  }
                  setIsGeneratingAiAd(false);
                }}
                disabled={isGeneratingAiAd || !aiAdPrompt.trim()}
                className="w-full min-h-[46px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-sm rounded-xl cursor-pointer"
              >
                {isGeneratingAiAd ? 'Creating Photo...' : 'Create Photo Now'}
              </button>

              {aiGeneratedAdImg && (
                <div className="space-y-3 pt-2">
                  <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
                    <img src={aiGeneratedAdImg} alt="AI Ad Visual" className="h-full object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          photos: [...prev.photos, aiGeneratedAdImg].slice(0, 4),
                        }));
                        setShowAiImageModal(false);
                      }}
                      className="flex-1 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Use This Photo
                    </button>
                    <a
                      href={aiGeneratedAdImg}
                      download="efado-ad-photo.png"
                      className="flex-1 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
