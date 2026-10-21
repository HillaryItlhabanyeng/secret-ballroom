import * as api from './api';
import { fromBase64, toBase64 } from './crypto/base64';
import {
  deriveDanceKeys, deriveRecoveryKeys, newJournalKey, randomSalt, unwrapJournalKey, wrapJournalKey,
} from './crypto/keys';
import { generateRecoveryCode, normalizeRecoveryCode } from './crypto/recovery';
import type { Dance } from './dance/types';

export type Session = {
  username: string;
  token: string;
  key: CryptoKey; // the journal key, unwrapped, in memory only
  expiresAt: string;
};

export type NewBallroom = { session: Session; recoveryCode: string };

export type RecoveryTicket = {
  username: string;
  recoveryAuthKey: string;
  journalKey: CryptoKey;
};

const averageRhythm = (a: Dance, b: Dance) => a.rhythmMs.map((gap, i) => Math.round((gap + b.rhythmMs[i]) / 2));

async function openSession(res: api.LoginResponse, kek: CryptoKey): Promise<Session> {
  const key = await unwrapJournalKey(res.wrappedKey, kek);
  return { username: res.username, token: res.token, key, expiresAt: res.expiresAt };
}

export async function createBallroom(username: string, first: Dance, second: Dance): Promise<NewBallroom> {
  const danceSalt = randomSalt();
  const recoverySalt = randomSalt();
  const recoveryCode = generateRecoveryCode();

  const [danceKeys, recoveryKeys] = await Promise.all([
    deriveDanceKeys(first.steps, danceSalt),
    deriveRecoveryKeys(normalizeRecoveryCode(recoveryCode), recoverySalt),
  ]);
  const journalKey = await newJournalKey();

  await api.register({
    username,
    authKey: danceKeys.authKey,
    kdfSalt: toBase64(danceSalt),
    rhythmMs: averageRhythm(first, second),
    wrappedKey: await wrapJournalKey(journalKey, danceKeys.kek),
    recoverySalt: toBase64(recoverySalt),
    recoveryAuthKey: recoveryKeys.authKey,
    recoveryWrappedKey: await wrapJournalKey(journalKey, recoveryKeys.kek),
  });

  const res = await api.login({ username, authKey: danceKeys.authKey, rhythmMs: second.rhythmMs });
  return { session: await openSession(res, danceKeys.kek), recoveryCode };
}

export async function enterBallroom(username: string, dance: Dance): Promise<Session> {
  const { kdfSalt } = await api.getSalt(username);
  const keys = await deriveDanceKeys(dance.steps, fromBase64(kdfSalt));
  const res = await api.login({ username, authKey: keys.authKey, rhythmMs: dance.rhythmMs });
  return openSession(res, keys.kek);
}

// Recovery step 1: the code unwraps the journal key
export async function startRecovery(username: string, code: string): Promise<RecoveryTicket> {
  const { recoverySalt } = await api.getRecoverySalt(username);
  const keys = await deriveRecoveryKeys(normalizeRecoveryCode(code), fromBase64(recoverySalt));
  const { recoveryWrappedKey } = await api.recoverStart({ username, recoveryAuthKey: keys.authKey });
  const journalKey = await unwrapJournalKey(recoveryWrappedKey, keys.kek, true);
  return { username, recoveryAuthKey: keys.authKey, journalKey };
}

// Recovery step 2: the same journal key gets wrapped with your new dance
export async function finishRecovery(ticket: RecoveryTicket, first: Dance, second: Dance): Promise<Session> {
  const salt = randomSalt();
  const keys = await deriveDanceKeys(first.steps, salt);

  const res = await api.recoverFinish({
    username: ticket.username,
    recoveryAuthKey: ticket.recoveryAuthKey,
    authKey: keys.authKey,
    kdfSalt: toBase64(salt),
    rhythmMs: averageRhythm(first, second),
    wrappedKey: await wrapJournalKey(ticket.journalKey, keys.kek),
  });
  return openSession(res, keys.kek);
}