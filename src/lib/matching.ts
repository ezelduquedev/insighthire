// src/lib/matching.ts
import { prisma } from './prisma';

export interface MatchResult {
  candidateId: string;
  jobOfferId: string;
  score: number;
  skillMatch: number;
  experienceMatch: number;
  seniorityMatch: number;
  explanation: string;
}

const SENIORITY_LEVELS: Record<string, number> = {
  JUNIOR: 1,
  MID: 2,
  SENIOR: 3,
  LEAD: 4,
};

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#.]/g, ' ').trim();
}

function skillsOverlap(candidateSkills: string[], offerSkills: string[]): number {
  if (offerSkills.length === 0) return 1;
  const normalizedCandidate = candidateSkills.map(normalizeName);
  let matched = 0;
  for (const required of offerSkills) {
    const norm = normalizeName(required);
    if (normalizedCandidate.some(cs => cs.includes(norm) || norm.includes(cs))) {
      matched++;
    }
  }
  return matched / offerSkills.length;
}

function seniorityScore(candidateSeniority: string | null, offerSeniority: string | null): number {
  if (!offerSeniority || !candidateSeniority) return 0.7; // neutral si falta info
  const cLevel = SENIORITY_LEVELS[candidateSeniority] ?? 0;
  const oLevel = SENIORITY_LEVELS[offerSeniority] ?? 0;
  const diff = Math.abs(cLevel - oLevel);
  if (diff === 0) return 1;
  if (diff === 1) return 0.6;
  return 0.2;
}

function experienceYears(experiences: Array<{ startDate: string; endDate: string | null }>): number {
  let total = 0;
  for (const exp of experiences) {
    const start = new Date(exp.startDate).getFullYear();
    const end = exp.endDate ? new Date(exp.endDate).getFullYear() : new Date().getFullYear();
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      total += end - start;
    }
  }
  return total;
}

function experienceScore(yearsCandidate: number, offerSeniority: string | null): number {
  const expected: Record<string, number> = { JUNIOR: 1, MID: 3, SENIOR: 6, LEAD: 9 };
  const target = offerSeniority ? (expected[offerSeniority] ?? 3) : 3;
  if (yearsCandidate >= target) return 1;
  if (target === 0) return 1;
  return Math.max(0, yearsCandidate / target);
}

function buildExplanation(
  skillMatch: number,
  experienceMatch: number,
  seniorityMatch: number,
  score: number,
  offerSkills: string[],
  candidateSkills: string[],
  candidateSeniority: string | null,
  offerSeniority: string | null,
  yearsExp: number,
): string {
  const lines: string[] = [];

  // Skills
  if (offerSkills.length > 0) {
    const normC = candidateSkills.map(normalizeName);
    const matched = offerSkills.filter(s => {
      const n = normalizeName(s);
      return normC.some(cs => cs.includes(n) || n.includes(cs));
    });
    const missing = offerSkills.filter(s => {
      const n = normalizeName(s);
      return !normC.some(cs => cs.includes(n) || n.includes(cs));
    });
    if (matched.length > 0) lines.push(`✅ Skills coincidentes: ${matched.slice(0, 5).join(', ')}.`);
    if (missing.length > 0) lines.push(`⚠️ Skills no encontradas: ${missing.slice(0, 4).join(', ')}.`);
  } else {
    lines.push('ℹ️ La oferta no especifica skills requeridas.');
  }

  // Seniority
  if (offerSeniority && candidateSeniority) {
    if (candidateSeniority === offerSeniority) {
      lines.push(`✅ Seniority exacto: ${candidateSeniority}.`);
    } else {
      lines.push(`📊 Seniority candidato: ${candidateSeniority} — Oferta requiere: ${offerSeniority}.`);
    }
  }

  // Experience
  lines.push(`📅 Experiencia estimada: ${yearsExp} año${yearsExp !== 1 ? 's' : ''}.`);

  // Score global
  const pct = Math.round(score * 100);
  if (pct >= 80) lines.push(`🏆 Compatibilidad alta (${pct}%).`);
  else if (pct >= 55) lines.push(`👍 Compatibilidad moderada (${pct}%).`);
  else lines.push(`🔍 Compatibilidad baja (${pct}%). Revisar requisitos.`);

  return lines.join(' ');
}

export async function calculateMatch(candidateId: string, jobOfferId: string): Promise<MatchResult> {
  const [candidate, offer] = await Promise.all([
    prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { skills: true, experiences: true },
    }),
    prisma.jobOffer.findUnique({ where: { id: jobOfferId } }),
  ]);

  if (!candidate || !offer) throw new Error('Candidato u oferta no encontrados');

  const candidateSkillNames = candidate.skills.map(s => s.name);
  const offerSkillNames = offer.skills ?? [];

  const skillMatch = skillsOverlap(candidateSkillNames, offerSkillNames);
  const senMatch = seniorityScore(candidate.seniority, offer.seniority);
  const yearsExp = experienceYears(candidate.experiences);
  const expMatch = experienceScore(yearsExp, offer.seniority);

  // Pesos: skills 50%, seniority 30%, experiencia 20%
  const score = skillMatch * 0.5 + senMatch * 0.3 + expMatch * 0.2;

  const explanation = buildExplanation(
    skillMatch, expMatch, senMatch, score,
    offerSkillNames, candidateSkillNames,
    candidate.seniority, offer.seniority, yearsExp,
  );

  // Upsert en BD
  await prisma.candidateMatch.upsert({
    where: { candidateId_jobOfferId: { candidateId, jobOfferId } },
    create: {
      candidateId,
      jobOfferId,
      score,
      skillMatch,
      experienceMatch: expMatch,
      seniorityMatch: senMatch,
      explanation,
    },
    update: {
      score,
      skillMatch,
      experienceMatch: expMatch,
      seniorityMatch: senMatch,
      explanation,
    },
  });

  return { candidateId, jobOfferId, score, skillMatch, experienceMatch: expMatch, seniorityMatch: senMatch, explanation };
}

export async function calculateMatchesForOffer(jobOfferId: string, userId: string) {
  const [offer, candidates] = await Promise.all([
    prisma.jobOffer.findFirst({ where: { id: jobOfferId, userId } }),
    prisma.candidate.findMany({
      where: { userId },
      include: { skills: true, experiences: true },
    }),
  ]);

  if (!offer) throw new Error('Oferta no encontrada');

  const results = await Promise.all(
    candidates.map(c => calculateMatch(c.id, jobOfferId).catch(() => null))
  );

  return results.filter(Boolean);
}