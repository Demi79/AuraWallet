import * as Keychain from 'react-native-keychain';

import type { Wallet } from '../../store/useWalletStore';

const WALLET_STORAGE_SERVICE = 'com.aurawallet.wallets';

interface StoredWalletPayload {
  readonly wallets: Wallet[];
}

function isWalletArray(value: unknown): value is Wallet[] {
  return Array.isArray(value);
}

export async function saveWalletsToStorage(wallets: Wallet[]): Promise<void> {
  const payload: StoredWalletPayload = { wallets };

  await Keychain.setGenericPassword('wallets', JSON.stringify(payload), {
    service: WALLET_STORAGE_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadWalletsFromStorage(): Promise<Wallet[]> {
  const credentials = await Keychain.getGenericPassword({
    service: WALLET_STORAGE_SERVICE,
  });

  if (!credentials) {
    return [];
  }

  try {
    const parsed = JSON.parse(credentials.password) as Partial<StoredWalletPayload>;

    return isWalletArray(parsed.wallets) ? parsed.wallets : [];
  } catch {
    await Keychain.resetGenericPassword({ service: WALLET_STORAGE_SERVICE });
    return [];
  }
}

export async function clearWalletsFromStorage(): Promise<void> {
  await Keychain.resetGenericPassword({ service: WALLET_STORAGE_SERVICE });
}