const fs = require('fs')
const path = require('path')
const file = path.join(__dirname, 'src/app/(dashboard)/dashboard/candidates/[id]/page.tsx')
fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(
  /\{candidate\.linkedIn && \(\s*\n[\s\S]*?LinkedIn\s*\n\s*<\/a>\s*\n\s*\)\}/,
  `{candidate.linkedIn && (
              
                href={candidate.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-indigo-400 text-sm hover:text-indigo-300"
              >
                <ExternalLink className="h-4 w-4" />
                LinkedIn
              </a>
            )}`
), 'utf8')
console.log('Parcheado OK')