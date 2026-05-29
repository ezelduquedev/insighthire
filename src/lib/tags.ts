// src/lib/tags.ts  (archivo nuevo)

const AREA_KEYWORDS: Record<string, string[]> = {
  frontend: [
    "react", "vue", "angular", "svelte", "html", "css", "sass", "scss",
    "tailwind", "javascript", "typescript", "next.js", "nuxt", "webpack",
    "vite", "figma", "ui", "ux", "dom", "bootstrap", "jquery",
  ],
  backend: [
    "node", "express", "fastify", "django", "flask", "fastapi", "spring",
    "laravel", "rails", "php", "java", "kotlin", "go", "rust", "c#",
    "dotnet", "api", "rest", "graphql", "microservices", "sql", "postgresql",
    "mysql", "mongodb", "redis", "prisma",
  ],
  devops: [
    "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "terraform",
    "ansible", "jenkins", "github actions", "ci/cd", "linux", "nginx",
    "bash", "shell", "helm", "prometheus", "grafana", "cloudformation",
  ],
  data: [
    "python", "pandas", "numpy", "scikit", "tensorflow", "pytorch", "keras",
    "spark", "hadoop", "airflow", "dbt", "tableau", "power bi", "ml",
    "machine learning", "deep learning", "nlp", "data science", "sql",
    "bigquery", "snowflake", "databricks",
  ],
  mobile: [
    "react native", "flutter", "swift", "kotlin", "android", "ios",
    "xcode", "objective-c", "expo", "ionic",
  ],
}

export function detectArea(skillNames: string[]): string {
  const scores: Record<string, number> = {
    frontend: 0, backend: 0, devops: 0, data: 0, mobile: 0,
  }

  for (const skill of skillNames) {
    const normalized = skill.toLowerCase()
    for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
      if (keywords.some(kw => normalized.includes(kw) || kw.includes(normalized))) {
        scores[area]++
      }
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1])

  // Si hay empate entre frontend y backend, es fullstack
  if (
    sorted[0][1] > 0 &&
    sorted[1][1] > 0 &&
    sorted[0][0] === "frontend" &&
    sorted[1][0] === "backend" &&
    sorted[1][1] >= sorted[0][1] * 0.6
  ) {
    return "fullstack"
  }
  if (
    sorted[0][1] > 0 &&
    sorted[1][1] > 0 &&
    sorted[0][0] === "backend" &&
    sorted[1][0] === "frontend" &&
    sorted[1][1] >= sorted[0][1] * 0.6
  ) {
    return "fullstack"
  }

  return sorted[0][1] > 0 ? sorted[0][0] : "general"
}

export function getAreaColor(area: string): string {
  const colors: Record<string, string> = {
    frontend:  "bg-pink-500/20 text-pink-400 border-pink-500/30",
    backend:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
    fullstack: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    devops:    "bg-orange-500/20 text-orange-400 border-orange-500/30",
    data:      "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    mobile:    "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    general:   "bg-slate-500/20 text-slate-400 border-slate-500/30",
  }
  return colors[area] ?? colors.general
}