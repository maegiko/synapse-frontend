/**
 * Upload rules for POST /api/notes/summarise, mirroring FRONTEND_API.md
 * section 8. The backend enforces all of this too; checking here keeps a
 * doomed 10 MB upload off the wire and gives a better message than a 413.
 */

interface NoteFileFormat {
  extension: string
  /** The declared MIME type the backend accepts for this extension. */
  mimeType: string
  label: string
}

const FORMATS: NoteFileFormat[] = [
  { extension: '.pdf', mimeType: 'application/pdf', label: 'PDF' },
  {
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: 'DOCX',
  },
  { extension: '.txt', mimeType: 'text/plain', label: 'TXT' },
  { extension: '.md', mimeType: 'text/markdown', label: 'Markdown' },
]

export const MAX_FILE_BYTES = 10 * 1024 * 1024

/** `accept` for the file input: extensions and types, so both pickers filter. */
export const FILE_ACCEPT = FORMATS.flatMap((format) => [format.extension, format.mimeType]).join(
  ',',
)

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatFor(file: File): NoteFileFormat | undefined {
  const name = file.name.toLowerCase()
  return FORMATS.find((format) => name.endsWith(format.extension))
}

/** One sentence naming what is wrong with the file, or null when it is fine. */
export function validateNoteFile(file: File): string | null {
  if (!formatFor(file)) {
    return 'Synapse can only read PDF, DOCX, TXT, and Markdown files. Legacy .doc files are not supported.'
  }
  if (file.size === 0) {
    return 'That file is empty. Choose one with some text in it.'
  }
  if (file.size > MAX_FILE_BYTES) {
    return `That file is ${formatFileSize(file.size)}, and the limit is ${formatFileSize(
      MAX_FILE_BYTES,
    )}. Choose a smaller file.`
  }
  return null
}

/**
 * Browsers leave `type` empty or fall back to `application/octet-stream` for
 * extensions they do not know — Markdown most of all — and the backend rejects
 * an octet-stream upload even when the filename looks supported. The extension
 * is validated above, so the declared type is restated from it before sending.
 */
export function withDeclaredType(file: File): File {
  const format = formatFor(file)
  if (!format) return file

  const declared = file.type.split(';')[0].trim().toLowerCase()
  if (declared === format.mimeType) return file

  return new File([file], file.name, {
    type: format.mimeType,
    lastModified: file.lastModified,
  })
}
