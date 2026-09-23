import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable('users', {
  userId: serial('user_id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Incidents Table
export const incidents = pgTable('incidents', {
  incidentId: serial('incident_id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.userId),
  incidentType: varchar('incident_type', { length: 30 }).notNull(),
  title: varchar('title', { length: 150 }),
  description: text('description'),
  incidentDate: timestamp('incident_date'),
  riskLevel: varchar('risk_level', { length: 20 }),
  riskScore: integer('risk_score'),
  status: varchar('status', { length: 20 }).default('ACTIVE'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Sources Table
export const sources = pgTable('sources', {
  sourceId: serial('source_id').primaryKey(),
  sourceType: varchar('source_type', { length: 30 }).notNull(),
  sourceValue: text('source_value').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Incident Sources Junction Table
export const incidentSources = pgTable(
  'incident_sources',
  {
    incidentId: integer('incident_id')
      .notNull()
      .references(() => incidents.incidentId, { onDelete: 'cascade' }),
    sourceId: integer('source_id')
      .notNull()
      .references(() => sources.sourceId, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.incidentId, table.sourceId] }),
  ]
);

// 5. Evidence Table
export const evidence = pgTable('evidence', {
  evidenceId: serial('evidence_id').primaryKey(),
  incidentId: integer('incident_id')
    .notNull()
    .references(() => incidents.incidentId, { onDelete: 'cascade' }),
  evidenceType: varchar('evidence_type', { length: 30 }).notNull(),
  fileName: varchar('file_name', { length: 255 }),
  filePath: text('file_path'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

// 6. Patterns Table
export const patterns = pgTable('patterns', {
  patternId: serial('pattern_id').primaryKey(),
  incidentId: integer('incident_id')
    .notNull()
    .references(() => incidents.incidentId, { onDelete: 'cascade' }),
  patternType: varchar('pattern_type', { length: 50 }).notNull(),
  description: text('description'),
  confidence: integer('confidence'),
});

// 7. Incident Similarity Table
export const incidentSimilarity = pgTable(
  'incident_similarity',
  {
    incidentId: integer('incident_id')
      .notNull()
      .references(() => incidents.incidentId, { onDelete: 'cascade' }),
    similarIncidentId: integer('similar_incident_id')
      .notNull()
      .references(() => incidents.incidentId, { onDelete: 'cascade' }),
    similarityScore: integer('similarity_score'),
  },
  (table) => [
    primaryKey({ columns: [table.incidentId, table.similarIncidentId] }),
  ]
);

// 8. Reports Table
export const reports = pgTable('reports', {
  reportId: serial('report_id').primaryKey(),
  incidentId: integer('incident_id')
    .notNull()
    .references(() => incidents.incidentId, { onDelete: 'cascade' }),
  reportTitle: varchar('report_title', { length: 150 }),
  reportContent: text('report_content'),
  generatedAt: timestamp('generated_at').defaultNow(),
});

// 9. Report History Table
export const reportHistory = pgTable('report_history', {
  historyId: serial('history_id').primaryKey(),
  reportId: integer('report_id')
    .notNull()
    .references(() => reports.reportId, { onDelete: 'cascade' }),
  action: varchar('action', { length: 30 }).notNull(),
  reportContent: text('report_content'),
  changedAt: timestamp('changed_at').defaultNow(),
});

// RELATIONS DEFINITIONS
export const usersRelations = relations(users, ({ many }) => ({
  incidents: many(incidents),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  author: one(users, {
    fields: [incidents.userId],
    references: [users.userId],
  }),
  incidentSources: many(incidentSources),
  evidence: many(evidence),
  patterns: many(patterns),
  similarIncidents: many(incidentSimilarity, { relationName: 'similar_from' }),
  reports: many(reports),
}));

export const sourcesRelations = relations(sources, ({ many }) => ({
  incidentSources: many(incidentSources),
}));

export const incidentSourcesRelations = relations(incidentSources, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentSources.incidentId],
    references: [incidents.incidentId],
  }),
  source: one(sources, {
    fields: [incidentSources.sourceId],
    references: [sources.sourceId],
  }),
}));

export const evidenceRelations = relations(evidence, ({ one }) => ({
  incident: one(incidents, {
    fields: [evidence.incidentId],
    references: [incidents.incidentId],
  }),
}));

export const patternsRelations = relations(patterns, ({ one }) => ({
  incident: one(incidents, {
    fields: [patterns.incidentId],
    references: [incidents.incidentId],
  }),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  incident: one(incidents, {
    fields: [reports.incidentId],
    references: [incidents.incidentId],
  }),
  history: many(reportHistory),
}));

export const reportHistoryRelations = relations(reportHistory, ({ one }) => ({
  report: one(reports, {
    fields: [reportHistory.reportId],
    references: [reports.reportId],
  }),
}));
