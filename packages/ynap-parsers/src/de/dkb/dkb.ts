import { MatcherFunction, ParserFunction, ParserModule, YnabFile } from '../..'
import { parse } from '../../util/papaparse'
import { readEncodedFile } from '../../util/read-encoded-file'

export interface DKBRow {
  Buchungsdatum: string
  Wertstellung: string
  Status: string
  'Zahlungspflichtige*r': string
  'Zahlungsempfänger*in': string
  Verwendungszweck: string
  Umsatztyp: string
  IBAN: string
  'Betrag (€)': string
  'Gläubiger-ID': string
  Mandatsreferenz: string
  Kundenreferenz: string
}

export const generateYnabDate = (input: string): string => {
  const match = input.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/)

  if (!match) {
    throw new Error(
      'The input is not a valid date. Expected format: DD.MM.YYYY'
    )
  }

  const [, day, month, year] = match
  return [
    month.padStart(2, '0'),
    day.padStart(2, '0'),
    year.padStart(4, '20'),
  ].join('/')
}

const parseNumber = (input: string): number => {
  const number = Number(input.replace(/[^\d,-]/g, '').replace(',', '.'))
  return number
}

const trimMetaData = (input: string): string => {
  return input.substring(input.indexOf('"Buchungsdatum";'))
}

export const DKBParser: ParserFunction = async (
  file: File
): Promise<YnabFile[]> => {
  const fileString = trimMetaData(await readEncodedFile(file))
  const { data } = await parse(fileString, { header: true, delimiter: ';' })
  return [
    {
      data: (data as DKBRow[])
        .filter(
          r =>
            r.Status === 'Gebucht' &&
            r.Wertstellung &&
            r['Betrag (€)'] &&
            r['Betrag (€)'] != '0'
        )
        .map(r => ({
          Date: generateYnabDate(r.Wertstellung),
          Payee: r['Zahlungsempfänger*in'].replace(/\s+/g, ' ').trim(),
          Memo: r.Verwendungszweck.replace(/\s+/g, ' ').trim(),
          Outflow:
            parseNumber(r['Betrag (€)']) < 0
              ? (-parseNumber(r['Betrag (€)'])).toFixed(2)
              : undefined,
          Inflow:
            parseNumber(r['Betrag (€)']) > 0
              ? parseNumber(r['Betrag (€)']).toFixed(2)
              : undefined,
        })),
    },
  ]
}

export const DKBMatcher: MatcherFunction = async (
  file: File
): Promise<boolean> => {
  const requiredKeys: (keyof DKBRow)[] = [
    'Buchungsdatum',
    'Wertstellung',
    'Status',
    'Zahlungspflichtige*r',
    'Zahlungsempfänger*in',
    'Verwendungszweck',
    'Umsatztyp',
    'IBAN',
    'Betrag (€)',
    'Gläubiger-ID',
    'Mandatsreferenz',
    'Kundenreferenz',
  ]
  const rawFileString = await readEncodedFile(file)

  try {
    const { data } = await parse(trimMetaData(rawFileString), {
      header: true,
      delimiter: ';',
    })

    if (data.length === 0) {
      return false
    }

    const keys = Object.keys(data[0])
    const missingKeys = requiredKeys.filter(k => !keys.includes(k))

    if (missingKeys.length === 0) {
      return true
    }
  } catch (e) {
    return false
  }

  return false
}

export const dkb: ParserModule = {
  name: 'Deutsche Kreditbank',
  country: 'de',
  link: 'https://www.dkb.de/fragen-antworten',
  fileExtension: 'csv',
  filenamePattern:
    /^[0-9]{2}-[0-9]{2}-[0-9]{4}_Umsatzliste_[\S]*_DE[0-9]{20}\.csv$/,
  match: DKBMatcher,
  parse: DKBParser,
}
