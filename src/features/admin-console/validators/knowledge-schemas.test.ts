import { knowledgeFileDocumentSchema, knowledgeSourceSchema, knowledgeTextDocumentSchema, knowledgeUrlDocumentSchema } from './knowledge-schemas'

function createFile(size: number) {
  return { name: 'doc.pdf', size } as File
}

describe('knowledge schemas', () => {
  it('validates source metadata', () => {
    expect(knowledgeSourceSchema.parse({
      authority: 'Ministerio',
      baseUrl: 'https://minsalud.example',
      country: 'CO',
      name: 'Guía nacional',
      notes: '',
      sourceType: 'GUIDELINE',
    })).toMatchObject({ country: 'CO' })
  })

  it('validates text, url and file document constraints', () => {
    const base = {
      audience: 'STAFF',
      authority: 'Ministerio',
      clinicalTags: '',
      country: 'CO',
      drugNames: '',
      redFlags: '',
      sourceType: 'GUIDELINE',
      specialty: 'GENERAL_MEDICINE',
      symptoms: '',
      title: 'Guía clínica',
      useCases: 'CLINICAL_SUMMARY',
    } as const

    expect(knowledgeTextDocumentSchema.parse({ ...base, contentText: 'Contenido clínico suficiente para la ingesta.' })).toBeTruthy()
    expect(knowledgeUrlDocumentSchema.parse({ ...base, sourceUrl: 'https://minsalud.example/guia' })).toBeTruthy()
    expect(knowledgeFileDocumentSchema.parse({ ...base, file: createFile(1024) })).toBeTruthy()
    expect(() => knowledgeFileDocumentSchema.parse({ ...base, file: createFile(6 * 1024 * 1024) })).toThrow()
  })
})
