import { randomBytes } from 'react-native-quick-crypto';
import * as bip39 from 'bip39';

export type MnemonicStrength = 128 | 160 | 192 | 224 | 256;

export interface GeneratedMnemonic {
  readonly mnemonic: string;
  readonly strength: MnemonicStrength;
  readonly wordCount: number;
}

const DEFAULT_STRENGTH: MnemonicStrength = 128;

function getWordCount(mnemonic: string): number {
  return mnemonic.trim().split(/\s+/).length;
}

export function generateMnemonicPhrase(
  strength: MnemonicStrength = DEFAULT_STRENGTH,
): GeneratedMnemonic {
  const entropyLength = strength / 8;
  const entropy = randomBytes(entropyLength);

  try {
    const mnemonic = bip39.entropyToMnemonic(entropy.toString('hex'));

    return {
      mnemonic,
      strength,
      wordCount: getWordCount(mnemonic),
    };
  } finally {
    entropy.fill(0);
  }
}

export function validateMnemonicPhrase(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}
