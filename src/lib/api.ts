/**
 * EFADO Ecosystem Unified API Client
 * 
 * Standardized across all 10 hubs, unified wallet, and payment gateways.
 * Always targets relative `/api/**` routes so it works seamlessly with both:
 * 1. Firebase Hosting rewrites to Cloud Function 'api' in production
 * 2. Express server / Vite proxy in development
 */

import { NEW_BACKEND_URL, getBackendUrl } from '../config/backend';

export interface ApiResponse<T = any> {
  success?: boolean;
  status?: string | boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class EfadoApiClient {
  private static baseUrl = NEW_BACKEND_URL;

  private static async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = getBackendUrl(endpoint);

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        mode: 'cors',
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status} from ${url}`);
      }

      return await response.json();
    } catch (err: any) {
      console.warn(`[EfadoApiClient] Error at ${url}:`, err.message);
      throw err;
    }
  }

  // ==========================================================================
  // SYSTEM & HEALTH
  // ==========================================================================
  static async checkHealth() {
    return this.request('/health');
  }

  // ==========================================================================
  // UNIFIED WALLET
  // ==========================================================================
  static async getWalletBalance(userId: string) {
    return this.request(`/wallet/balance?userId=${encodeURIComponent(userId)}`);
  }

  static async depositWallet(payload: { userId: string; amount: number; paymentMethod: string; reference?: string }) {
    return this.request('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // ==========================================================================
  // PAYMENT GATEWAYS (OPAY, FLUTTERWAVE, PAYSTACK)
  // ==========================================================================
  static async initializeOpay(amount: number, userId: string, phone?: string) {
    return this.request('/opay/initialize', {
      method: 'POST',
      body: JSON.stringify({ amount, userId, phone, domain: window.location.origin })
    });
  }

  static async getOpayStatus(reference: string) {
    return this.request(`/opay/status/${encodeURIComponent(reference)}`);
  }

  static async initializeFlutterwave(payload: any) {
    return this.request('/flutterwave/initialize', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async createFlutterwaveSubaccount(payload: any) {
    return this.request('/flutterwave/subaccount', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  static async getBanks() {
    return this.request('/flutterwave/banks');
  }

  static async verifyBank(accountNumber: string, bankCode: string) {
    return this.request(`/verify-bank?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`);
  }

  // ==========================================================================
  // ALL 15 ECOSYSTEM HUBS
  // ==========================================================================
  static async getHubsCatalog() {
    return this.request('/hubs');
  }

  // Gaming Arena
  static async gamingPlay(payload: { userId: string; betAmount: number; targetMultiplier: number; gameType?: string }) {
    return this.request('/hubs/gaming/play', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async gamingSpin(userId: string) {
    return this.request('/hubs/gaming/spin', { method: 'POST', body: JSON.stringify({ userId }) });
  }

  static async getGamingLeaderboard(userId: string) {
    return this.request(`/hubs/gaming/leaderboard/${encodeURIComponent(userId)}`);
  }

  static async claimGamingBonus(userId: string) {
    return this.request('/hubs/gaming/bonus/claim', { method: 'POST', body: JSON.stringify({ userId }) });
  }

  // Advertising & Name Hub
  static async createAd(payload: any) {
    return this.request('/hubs/advertising/create', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async getAds() {
    return this.request('/hubs/advertising/list');
  }

  static async generateBrandName(payload: { industry?: string; keywords?: string[] }) {
    return this.request('/hubs/name/generate', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async checkBrandName(name: string) {
    return this.request('/hubs/name/check', { method: 'POST', body: JSON.stringify({ name }) });
  }

  // Service Corps, Job Hub, Community Hub
  static async requestService(payload: any) {
    return this.request('/hubs/service/request', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async getServiceProviders() {
    return this.request('/hubs/service/providers');
  }

  static async postJob(payload: any) {
    return this.request('/hubs/job/post', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async getJobs() {
    return this.request('/hubs/job/list');
  }

  static async postCommunity(payload: any) {
    return this.request('/hubs/community/post', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async getCommunityFeed() {
    return this.request('/hubs/community/feed');
  }

  // Hepnands Loan Hub
  static async applyLoan(payload: any) {
    return this.request('/hubs/loan/apply', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async getLoanStatus(userId: string) {
    return this.request(`/hubs/loan/status/${encodeURIComponent(userId)}`);
  }

  static async repayLoan(payload: any) {
    return this.request('/hubs/loan/repay', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async getLoanEligibility(userId: string) {
    return this.request(`/hubs/loan/eligibility/${encodeURIComponent(userId)}`);
  }

  // Domain Hub & China Sourcing
  static async searchDomain(domain: string) {
    return this.request('/hubs/domain/search', { method: 'POST', body: JSON.stringify({ domain }) });
  }

  static async buyDomain(payload: any) {
    return this.request('/hubs/domain/buy', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async requestChinaSourcing(payload: any) {
    return this.request('/hubs/sourcing/request', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async trackSourcing(orderId: string) {
    return this.request(`/hubs/sourcing/track/${encodeURIComponent(orderId)}`);
  }

  // Crypto OTC & Partner Hub
  static async createCryptoOtcOrder(payload: any) {
    return this.request('/hubs/crypto/otc/order', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async getCryptoRates() {
    return this.request('/hubs/crypto/rates');
  }

  static async getPartnerStats(userId: string) {
    return this.request(`/hubs/partner/stats/${encodeURIComponent(userId)}`);
  }

  static async withdrawPartnerEarnings(payload: any) {
    return this.request('/hubs/partner/withdraw', { method: 'POST', body: JSON.stringify(payload) });
  }

  // House Hub & Cargo (Bamboo Cargo)
  static async listHouse(payload: any) {
    return this.request('/hubs/house/list', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async shipBambooCargo(payload: any) {
    return this.request('/hubs/cargo/ship', { method: 'POST', body: JSON.stringify(payload) });
  }

  // Food, Transport, Market, Pharma, Telecom
  static async hubFoodOrder(payload: any) {
    return this.request('/hubs/food', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async hubTransportBooking(payload: any) {
    return this.request('/hubs/transport', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async hubMarketOrder(payload: any) {
    return this.request('/hubs/market', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async hubPharmaOrder(payload: any) {
    return this.request('/hubs/pharma', { method: 'POST', body: JSON.stringify(payload) });
  }

  static async hubTelecomVtuOrder(payload: any) {
    return this.request('/hubs/telecom', { method: 'POST', body: JSON.stringify(payload) });
  }
}

export const api = EfadoApiClient;
