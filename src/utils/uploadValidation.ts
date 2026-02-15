export interface FileSelections {
  ticketsFile: File | null
  meetupsFile: File | null
}

export interface ValidationResult {
  valid: boolean
  error: string | null
}

export function validateFileSelections(selections: FileSelections): ValidationResult {
  const { ticketsFile, meetupsFile } = selections
  const hasAnyFile = ticketsFile || meetupsFile

  if (!hasAnyFile) {
    return { valid: false, error: null }
  }

  return { valid: true, error: null }
}
