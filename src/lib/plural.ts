/** `plural(1, 'note')` → "1 note"; `plural(3, 'quiz', 'quizzes')` → "3 quizzes". */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}
