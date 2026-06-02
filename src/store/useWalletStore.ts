import { create } from 'zustand';

import type { BitcoinWalletType, DerivedWalletData } from '../core/crypto/walletDerivation';
import {
  clearWalletsFromStorage,
  loadWalletsFromStorage as loadWalletsFromSecureStorage,
  saveWalletsToStorage,
} from '../core/storage/walletStorage';

export interface Wallet {
  readonly id: string;
  readonly name: string;
  readonly type: BitcoinWalletType;
  readonly publicKey: string;
  readonly address: string;
  readonly path: string;
}

export interface CreateWalletInput extends DerivedWalletData {
  readonly name: string;
}

interface WalletStoreState {
  readonly wallets: Wallet[];
  readonly addWallet: (wallet: CreateWalletInput) => Promise<Wallet>;
  readonly deleteWallet: (id: string) => Promise<void>;
  readonly loadWalletsFromStorage: () => Promise<void>;
  readonly clearWallets: () => Promise<void>;
}

function createWalletId(): string {
  return `wallet_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function toWallet(input: CreateWalletInput): Wallet {
  return {
    id: createWalletId(),
    name: input.name.trim(),
    type: input.type,
    publicKey: input.publicKey,
    address: input.address,
    path: input.path,
  };
}

export const useWalletStore = create<WalletStoreState>((set, get) => ({
  wallets: [],

  addWallet: async (walletInput) => {
    const wallet = toWallet(walletInput);
    const nextWallets = [...get().wallets, wallet];

    await saveWalletsToStorage(nextWallets);
    set({ wallets: nextWallets });

    return wallet;
  },

  deleteWallet: async (id) => {
    const nextWallets = get().wallets.filter((wallet) => wallet.id !== id);

    await saveWalletsToStorage(nextWallets);
    set({ wallets: nextWallets });
  },

  loadWalletsFromStorage: async () => {
    const wallets = await loadWalletsFromSecureStorage();
    set({ wallets });
  },

  clearWallets: async () => {
    await clearWalletsFromStorage();
    set({ wallets: [] });
  },
}));