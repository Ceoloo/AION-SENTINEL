/**
 * Sentinel Keycloak identity library contract consumed by AION Runtime.
 * Runtime is authoritative for actor grants, tenant selection, policy and
 * human approval. No call here performs a side effect or provisions identity.
 */
export interface SentinelPrincipal {
  principalId: string;
  actorId: string;
  kind: 'operator' | 'service' | 'agent-worker';
  tenantIds: string[];
  roles: Array<'invoke' | 'approve'>;
}
export interface BindingRecord extends SentinelPrincipal {
  issuer: string;
  subject: string;
  clientId: string;
  status: 'active' | 'disabled' | 'revoked';
}
export interface DurableActor {
  actorId: string;
  actorType: 'human' | 'service' | 'agent' | 'system';
  tenantId?: string | undefined;
  revocationState?: string | undefined;
}
export interface KeycloakConfig {
  issuer: string;
  audience: string;
  allowedClients: string[];
}
export type KeycloakVerifier = (input: { credential?: string }) =>
  Promise<{ verified: false } | { verified: true; principal: Readonly<SentinelPrincipal> }>;
export function validateKeycloakConfig(input: KeycloakConfig): Readonly<KeycloakConfig & {
  jwksUrl: string;
}>;
export function validRuntimePrincipal(value: unknown): value is SentinelPrincipal;
export function createRuntimePrincipalLookup(input: {
  getBinding: (identity: { issuer: string; subject: string; clientId: string }) =>
    Promise<BindingRecord | undefined | null>;
  getActor: (actorId: string) => Promise<DurableActor | undefined | null>;
}): (identity: { issuer: string; subject: string; clientId: string }) =>
  Promise<SentinelPrincipal | null>;
export function createKeycloakVerifier(input: KeycloakConfig & {
  lookupPrincipal: (identity: { issuer: string; subject: string; clientId: string }) =>
    Promise<SentinelPrincipal | null>;
  /** Tests only: public JWK key resolver. Never supply an untrusted one. */
  jwks?: (...args: unknown[]) => Promise<unknown>;
}): KeycloakVerifier;

export function createAuditEvent(input?: Record<string, unknown>): Readonly<Record<string, unknown>>;
export function createTrustBoundary(input?: {
  verifyIdentity?: (data: { credential: string }) => Promise<unknown>;
  decidePermission?: (data: unknown) => Promise<unknown>;
  recordAudit?: (data: unknown) => Promise<void>;
}): { authorize(data?: Record<string, unknown>): Promise<{ allowed: boolean; reason: string; eventId: string | null }> };
export function createSentinelServer(): import('node:http').Server;
