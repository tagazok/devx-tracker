export async function readJsonFile<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string)
        resolve(parsed)
      } catch {
        reject(new Error(`Invalid JSON in "${file.name}"`))
      }
    }
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}"`))
    reader.readAsText(file)
  })
}
