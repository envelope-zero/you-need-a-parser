import 'mdn-polyfills/String.prototype.startsWith'
import { ParserFunction, MatcherFunction, ParserModule } from '../..'
import { parse } from '../../util/papaparse'
import { readEncodedFile } from '../../util/read-encoded-file'

export interface GLSRow {
	"Bezeichnung Auftragskonto": string
	"IBAN Auftragskonto": string
	"BIC Auftragskonto": string
	"Bankname Auftragskonto": string
	Buchungstag: string
	Valutadatum: string
	"Name Zahlungsbeteiligter": string
	"IBAN Zahlungsbeteiligter": string
	"BIC (SWIFT-Code) Zahlungsbeteiligter": string
	Buchungstext: string
	Verwendungszweck: string
	Betrag: string
	Waehrung: string
	"Saldo nach Buchung": string
	Bemerkung: string
	"Gekennzeichneter Umsatz": string
	"Glaeubiger ID": string
	Mandatsreferenz: string
}

export const generateYnabDate = (input: string) => {
  const match = input.match(/(\d{2})\.(\d{2})\.(\d{4})/)

  if (!match) {
    throw new Error(
      'The input is not a valid date. Expected format: DD.MM.YYYY'
    )
  }

  const [, day, month, year] = match
  return [month.padStart(2, '0'), day.padStart(2, '0'), year].join('/')
}

export const parseNumber = (input: string) => Number(input.replace(',', '.'))

const trimMetaData = (input: string): string => {
  return input.substring(input.indexOf('Bezeichnung Auftragskonto;'))
}

export const sanitizeMemo = (input: string) => {
  const indexOfTan: number = input.indexOf('TAN:')
  if (indexOfTan === -1) {
    return input
  }
  return input.slice(0, indexOfTan).trim()
}

export const findPayee = (payee: string, category: string, accountname: string, memo: string): string => {
  if (payee.length > 0) {
    return payee
  }
  if (category === "Abschluss") {
    return 'GLS Gemeinschaftsbank eG'
  }
  if (accountname === 'Kreditkartenkonto') {
    if (memo.startsWith("Abrechnung")) {
      return '' //TODO: should map to main account but no idea how
    }
    const payeeMatch = memo.match(/(.*?) {4,}[A-Z]{3}\s/)
    if (!payeeMatch) {
      return ''
    }
    const [, matchedPayee] = payeeMatch
    return matchedPayee.trim()
  }
  return ''
}

export const GLSParser: ParserFunction = async (file: File) => {
  const fileString = trimMetaData(await readEncodedFile(file))
  const { data } = await parse(fileString, { header: true, delimiter: ';' })

  return [
    {
      data: (data as GLSRow[])
        .filter(r => r.Valutadatum && r.Betrag)
        .map(r => ({
          Date: generateYnabDate(r.Valutadatum),
          Payee: findPayee(r['Name Zahlungsbeteiligter'], r.Buchungstext, r["Bezeichnung Auftragskonto"], r.Verwendungszweck),
          Memo: sanitizeMemo(r.Verwendungszweck),
	  Category: r.Buchungstext,
          Outflow:
            parseNumber(r.Betrag) < 0
              ? (-parseNumber(r.Betrag)).toFixed(2)
              : undefined,
          Inflow:
            parseNumber(r.Betrag) > 0
              ? parseNumber(r.Betrag).toFixed(2)
              : undefined,
        })),
    },
  ]
}

export const GLSMatcher: MatcherFunction = async (file: File) => {
  const requiredKeys: (keyof GLSRow)[] = [
	  'Bezeichnung Auftragskonto',
	  'IBAN Auftragskonto',
	  'BIC Auftragskonto',
	  'Bankname Auftragskonto',
	  'Buchungstag',
	  'Valutadatum',
	  'Name Zahlungsbeteiligter',
	  'IBAN Zahlungsbeteiligter',
	  'BIC (SWIFT-Code) Zahlungsbeteiligter',
	  'Buchungstext',
	  'Verwendungszweck',
	  'Betrag',
	  'Waehrung',
	  'Saldo nach Buchung',
	  'Bemerkung',
	  'Gekennzeichneter Umsatz',
	  'Glaeubiger ID',
	  'Mandatsreferenz'
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
export const gls: ParserModule = {
  name: 'GLS',
  country: 'de',
  fileExtension: 'csv',
  filenamePattern: /Umsaetze_(.+?)_\d{4}\.\d{2}\.\d{2}\.csv/,
  link: 'https://www.gls.de/',
  match: GLSMatcher,
  parse: GLSParser,
}
