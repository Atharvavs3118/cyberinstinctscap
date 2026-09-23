import { eq, desc } from 'drizzle-orm';
import { db } from './index';
import {
  users,
  incidents,
  sources,
  incidentSources,
  evidence,
  patterns,
  incidentSimilarity,
  reports,
  reportHistory,
} from './schema';

// =========================
// REGISTER USER
// =========================
export async function registerUser(username: string, passwordHash: string) {
  try {
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        passwordHash,
      })
      .returning();
    return newUser || null;
  } catch (error) {
    console.error('Registration failed:', error);
    return null;
  }
}

// =========================
// GET USER
// =========================
export async function getUser(username: string) {
  try {
    const [user] = await db
      .select({
        userId: users.userId,
        username: users.username,
        passwordHash: users.passwordHash,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.username, username));
    return user || null;
  } catch (error) {
    console.error('Getting user failed:', error);
    return null;
  }
}

// =========================
// CHECK USERNAME
// =========================
export async function usernameExists(username: string): Promise<boolean> {
  try {
    const [user] = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.username, username));
    return Boolean(user);
  } catch (error) {
    console.error('Username check failed:', error);
    return false;
  }
}

// =========================
// CREATE INCIDENT
// =========================
export async function createIncident(params: {
  userId: number;
  incidentType: string;
  title: string;
  description?: string;
  incidentDate?: Date;
  riskLevel?: string;
  riskScore?: number;
  status?: string;
}) {
  try {
    const [newIncident] = await db
      .insert(incidents)
      .values({
        userId: params.userId,
        incidentType: params.incidentType,
        title: params.title,
        description: params.description,
        incidentDate: params.incidentDate || new Date(),
        riskLevel: params.riskLevel || 'MEDIUM',
        riskScore: params.riskScore ?? 50,
        status: params.status || 'ACTIVE',
      })
      .returning();
    return newIncident || null;
  } catch (error) {
    console.error('Incident creation failed:', error);
    return null;
  }
}

// =========================
// GET ALL INCIDENTS
// =========================
export async function getAllIncidents() {
  try {
    return await db.select().from(incidents).orderBy(desc(incidents.createdAt));
  } catch (error) {
    console.error('Getting all incidents failed:', error);
    return [];
  }
}

// =========================
// GET USER INCIDENTS
// =========================
export async function getUserIncidents(userId: number) {
  try {
    return await db
      .select()
      .from(incidents)
      .where(eq(incidents.userId, userId))
      .orderBy(desc(incidents.createdAt));
  } catch (error) {
    console.error('Getting incidents failed:', error);
    return [];
  }
}

// =========================
// ADD SOURCE
// =========================
export async function addSource(sourceType: string, sourceValue: string) {
  try {
    // Check if source exists
    const existing = await db
      .select({ sourceId: sources.sourceId })
      .from(sources)
      .where(eq(sources.sourceValue, sourceValue));

    if (existing.length > 0) {
      return existing[0].sourceId;
    }

    const [newSource] = await db
      .insert(sources)
      .values({
        sourceType,
        sourceValue,
      })
      .returning({ sourceId: sources.sourceId });

    return newSource?.sourceId || null;
  } catch (error) {
    console.error('Adding source failed:', error);
    return null;
  }
}

// =========================
// CONNECT SOURCE TO INCIDENT
// =========================
export async function connectSourceToIncident(incidentId: number, sourceId: number) {
  try {
    await db
      .insert(incidentSources)
      .values({
        incidentId,
        sourceId,
      })
      .onConflictDoNothing();
    return true;
  } catch (error) {
    console.error('Connecting source to incident failed:', error);
    return false;
  }
}

// =========================
// SEARCH INCIDENTS BY SOURCE
// =========================
export async function searchIncidentsBySource(sourceValue: string) {
  try {
    const results = await db
      .select({
        incidentId: incidents.incidentId,
        incidentType: incidents.incidentType,
        title: incidents.title,
        description: incidents.description,
        riskLevel: incidents.riskLevel,
        riskScore: incidents.riskScore,
        status: incidents.status,
        sourceType: sources.sourceType,
        sourceValue: sources.sourceValue,
        createdAt: incidents.createdAt,
      })
      .from(incidents)
      .innerJoin(incidentSources, eq(incidents.incidentId, incidentSources.incidentId))
      .innerJoin(sources, eq(incidentSources.sourceId, sources.sourceId))
      .where(eq(sources.sourceValue, sourceValue))
      .orderBy(desc(incidents.createdAt));

    return results;
  } catch (error) {
    console.error('Source search failed:', error);
    return [];
  }
}

// =========================
// ADD EVIDENCE
// =========================
export async function addEvidence(
  incidentId: number,
  evidenceType: string,
  fileName?: string,
  filePath?: string
) {
  try {
    const [newEvidence] = await db
      .insert(evidence)
      .values({
        incidentId,
        evidenceType,
        fileName,
        filePath,
      })
      .returning();
    return newEvidence || null;
  } catch (error) {
    console.error('Adding evidence failed:', error);
    return null;
  }
}

// =========================
// GET INCIDENT EVIDENCE
// =========================
export async function getIncidentEvidence(incidentId: number) {
  try {
    return await db
      .select()
      .from(evidence)
      .where(eq(evidence.incidentId, incidentId))
      .orderBy(desc(evidence.uploadedAt));
  } catch (error) {
    console.error('Getting evidence failed:', error);
    return [];
  }
}

// =========================
// ADD PATTERN
// =========================
export async function addPattern(
  incidentId: number,
  patternType: string,
  description: string,
  confidence: number
) {
  try {
    const [newPattern] = await db
      .insert(patterns)
      .values({
        incidentId,
        patternType,
        description,
        confidence,
      })
      .returning();
    return newPattern || null;
  } catch (error) {
    console.error('Adding pattern failed:', error);
    return null;
  }
}

// =========================
// GET INCIDENT PATTERNS
// =========================
export async function getIncidentPatterns(incidentId: number) {
  try {
    return await db
      .select()
      .from(patterns)
      .where(eq(patterns.incidentId, incidentId))
      .orderBy(desc(patterns.confidence));
  } catch (error) {
    console.error('Getting patterns failed:', error);
    return [];
  }
}

// =========================
// ADD INCIDENT SIMILARITY
// =========================
export async function addSimilarity(
  incidentId: number,
  similarIncidentId: number,
  similarityScore: number
) {
  try {
    await db
      .insert(incidentSimilarity)
      .values({
        incidentId,
        similarIncidentId,
        similarityScore,
      })
      .onConflictDoUpdate({
        target: [incidentSimilarity.incidentId, incidentSimilarity.similarIncidentId],
        set: { similarityScore },
      });
    return true;
  } catch (error) {
    console.error('Adding similarity failed:', error);
    return false;
  }
}

// =========================
// GET SIMILAR INCIDENTS
// =========================
export async function getSimilarIncidents(incidentId: number) {
  try {
    return await db
      .select()
      .from(incidentSimilarity)
      .where(eq(incidentSimilarity.incidentId, incidentId))
      .orderBy(desc(incidentSimilarity.similarityScore));
  } catch (error) {
    console.error('Getting similar incidents failed:', error);
    return [];
  }
}

// =========================
// ADD REPORT
// =========================
export async function addReport(
  incidentId: number,
  reportTitle: string,
  reportContent: string
) {
  try {
    const [newReport] = await db
      .insert(reports)
      .values({
        incidentId,
        reportTitle,
        reportContent,
      })
      .returning();
    return newReport || null;
  } catch (error) {
    console.error('Adding report failed:', error);
    return null;
  }
}

// =========================
// GET INCIDENT REPORT
// =========================
export async function getIncidentReport(incidentId: number) {
  try {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.incidentId, incidentId))
      .orderBy(desc(reports.generatedAt));
  } catch (error) {
    console.error('Getting report failed:', error);
    return [];
  }
}

// =========================
// ADD REPORT HISTORY
// =========================
export async function addReportHistory(
  reportId: number,
  action: string,
  reportContent: string
) {
  try {
    const [newHistory] = await db
      .insert(reportHistory)
      .values({
        reportId,
        action,
        reportContent,
      })
      .returning();
    return newHistory || null;
  } catch (error) {
    console.error('Adding report history failed:', error);
    return null;
  }
}

// =========================
// GET REPORT HISTORY
// =========================
export async function getReportHistory(reportId: number) {
  try {
    return await db
      .select()
      .from(reportHistory)
      .where(eq(reportHistory.reportId, reportId))
      .orderBy(desc(reportHistory.changedAt));
  } catch (error) {
    console.error('Getting report history failed:', error);
    return [];
  }
}
