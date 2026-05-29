// Ruta destino: src/types/index.ts
// Crear carpeta: src/types/

export interface Candidate {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  location: string | null
  linkedin: string | null
  seniority: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | null
  status: 'NEW' | 'IN_REVIEW' | 'TECHNICAL_INTERVIEW' | 'CULTURAL_INTERVIEW' | 'OFFER_SENT' | 'HIRED' | 'REJECTED' | 'ARCHIVED'
  summary: string | null
  strengths: string | string[] | null
  weaknesses: string | string[] | null
  technicalScore: number | null
  generalScore: number | null
  justification: string | null
  isFavorite?: boolean
  createdAt: string
  updatedAt: string
  resume?: Resume
  experiences?: Experience[]
  educations?: Education[]
  skills?: Skill[]
}

export interface Resume {
  id: string
  fileName: string
  fileUrl?: string
  fileType: string
  rawText: string | null
  parsedData?: any
}

export interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string | null
  description: string | null
  technologies: string[]
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string | null
}

export interface Skill {
  id: string
  name: string
  category: string
  level: number
}

export interface JobOffer {
  id: string
  title: string
  company: string
  description: string
  requirements: string | null
  seniority: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | null
  location: string | null
  isRemote: boolean
  skills: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    matches: number
  }
}

export interface ChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  sources?: Array<{
    content: string
    chunkType: string
    similarity: number
  }>
  createdAt: string
}

export interface AnalysisResult {
  summary: string
  seniority: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD'
  strengths: string[]
  weaknesses: string[]
  technicalScore: number
  generalScore: number
  justification: string
}
