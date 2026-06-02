import { BIP32Factory, type BIP32Interface } from 'bip32';
import * as bip39 from 'bip39';
import { payments, networks, type Network } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
export type BitcoinWalletType = 'segwit' | 'legacy';

export interface DerivedWalletData {
  readonly type: BitcoinWalletType;
  readonly publicKey: string;
  readonly address: string;
  readonly path: string;
}

export interface DeriveWalletOptions {
  readonly account?: number;
  readonly addressIndex?: number;
  readonly network?: Network;
}

const bip32 = BIP32Factory(ecc);
const BITCOIN_NETWORK = networks.bitcoin;

function buildDerivationPath(
  type: BitcoinWalletType,
  account: number,
  addressIndex: number,
): string {
  const purpose = type === 'segwit' ? 84 : 44;

  return `m/${purpose}'/0'/${account}'/0/${addressIndex}`;
}

function deriveNodeFromMnemonic(
  mnemonic: string,
  path: string,
  network: Network,
): BIP32Interface {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Mnemonic is invalid.');
  }

  const seed = bip39.mnemonicToSeedSync(mnemonic);

  try {
    const root = bip32.fromSeed(seed, network);
    const child = root.derivePath(path);

    if (!child.publicKey) {
      throw new Error('Unable to derive public key from seed.');
    }

    return child;
  } finally {
    seed.fill(0);
  }
}

function deriveAddressFromNode(
  node: BIP32Interface,
  type: BitcoinWalletType,
  network: Network,
): string {
  const payment =
    type === 'segwit'
      ? payments.p2wpkh({ pubkey: node.publicKey, network })
      : payments.p2pkh({ pubkey: node.publicKey, network });

  if (!payment.address) {
    throw new Error('Unable to derive Bitcoin address.');
  }

  return payment.address;
}

export function deriveBitcoinWallet(
  mnemonic: string,
  type: BitcoinWalletType,
  options: DeriveWalletOptions = {},
): DerivedWalletData {
  const account = options.account ?? 0;
  const addressIndex = options.addressIndex ?? 0;
  const network = options.network ?? BITCOIN_NETWORK;
  const path = buildDerivationPath(type, account, addressIndex);
  const node = deriveNodeFromMnemonic(mnemonic, path, network);

  return {
    type,
    publicKey: Buffer.from(node.publicKey).toString('hex'),
    address: deriveAddressFromNode(node, type, network),
    path,
  };
}

export function deriveNativeSegWitWallet(
  mnemonic: string,
  options: DeriveWalletOptions = {},
): DerivedWalletData {
  return deriveBitcoinWallet(mnemonic, 'segwit', options);
}

export function deriveLegacyWallet(
  mnemonic: string,
  options: DeriveWalletOptions = {},
): DerivedWalletData {
  return deriveBitcoinWallet(mnemonic, 'legacy', options);
}