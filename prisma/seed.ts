import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Limpieza en orden inverso por las relaciones
  await prisma.$transaction([
    prisma.note.deleteMany(),
    prisma.chatMessage.deleteMany(),
    prisma.embedding.deleteMany(),
    prisma.candidateMatch.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.education.deleteMany(),
    prisma.experience.deleteMany(),
    prisma.resume.deleteMany(),
    prisma.candidate.deleteMany(),
    prisma.jobOffer.deleteMany(),
    prisma.user.deleteMany(),
  ])

  const hashedPassword = await bcrypt.hash("password123", 10)

  const admin = await prisma.user.create({
    data: {
      email: "admin@insighthire.com",
      name: "Admin InsightHire",
      password: hashedPassword,
      role: "ADMIN",
    },
  })

  await prisma.user.create({
    data: {
      email: "recruiter@insighthire.com",
      name: "María Recruiter",
      password: hashedPassword,
      role: "RECRUITER",
    },
  })

  const candidates = [
    {
      name: "Alejandro García",
      email: "alejandro.garcia@gmail.com",
      phone: "+34 612 345 678",
      seniority: "SENIOR",
      status: "IN_REVIEW",
      favorite: true,
      technicalScore: 87,
      generalScore: 82,
      summary: "Desarrollador fullstack con 7 años de experiencia.",
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      experience: {
        company: "Cabify",
        position: "Senior Frontend Developer",
        startDate: "2020-03-01",
        description: "Liderazgo del equipo frontend.",
      },
      education: {
        institution: "Universidad Politécnica de Madrid",
        degree: "Ingeniería Informática",
        field: "Ingeniería del Software",
        startDate: "2013-09-01",
      },
    },
    {
      name: "Laura Martínez",
      email: "laura.martinez@outlook.com",
      phone: "+34 623 456 789",
      seniority: "MID",
      status: "TECHNICAL_INTERVIEW",
      favorite: false,
      technicalScore: 74,
      generalScore: 78,
      summary: "Desarrolladora backend especializada en Python.",
      skills: ["Python", "FastAPI", "Django"],
      experience: {
        company: "Glovo",
        position: "Backend Developer",
        startDate: "2021-06-01",
        description: "Desarrollo de APIs REST.",
      },
      education: {
        institution: "Universidad Autónoma de Barcelona",
        degree: "Grado en Matemáticas",
        field: "Matemáticas Aplicadas",
        startDate: "2015-09-01",
      },
    }
  ]

  for (const c of candidates) {
    await prisma.candidate.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        seniority: c.seniority as any,
        status: c.status as any,
        favorite: c.favorite,
        technicalScore: c.technicalScore,
        generalScore: c.generalScore,
        summary: c.summary,
        userId: admin.id,
        skills: {
          create: c.skills.map((name) => ({
            name,
            category: "TECHNICAL",
            level: 3,
          })),
        },
        experiences: {
          create: [c.experience],
        },
        education: {
          create: [c.education],
        },
      },
    })
  }

  console.log("Seed completado con éxito.")
}

main()
  .catch((e) => {
    console.error("Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })