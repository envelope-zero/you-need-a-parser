import 'mdn-polyfills/String.prototype.startsWith'
import { ParserFunction, MatcherFunction, ParserModule, YnabRow } from '..'
import { parse as parseCsv } from '../util/papaparse'
import { readEncodedFile } from '../util/read-encoded-file'
import { parseDate, ynabDate } from './parse-date'
import { ParserConfig } from '@envelope-zero/ynap-bank2ynab-converter/parserconfig'

import banks from './banks.json'

export const parseNumber = (input?: string) => {
  if (typeof input === 'undefined') {
    return undefined
  }

  // Return 0 for an empty string since this is an empty field
  if (!input.trim()) {
    return 0
  }

  // Remove all superfluous characters
  let cleaned = input.replace(/[^\d.,-]/g, '')
  if (cleaned == '') {
    return NaN
  }

  // If the cleaned string contains both "," and ".", it has
  // one or more thousands separators AND a decimal separator.
  // Determine the decimal separator and remove the thousands separator
  if ([',', '.'].every(term => cleaned.includes(term))) {
    const comma = cleaned.indexOf(',')
    const dot = cleaned.indexOf('.')

    if (dot > comma) {
      // If "." is used as decimal separator, remove the thousands separators
      cleaned = cleaned.replace(',', '')
    } else {
      // If "," is used as decimal separator, remove the "." as thousands separator
      cleaned = cleaned.replace('.', '')
    }
  }

  // Replace "," as decimal separator with "."
  cleaned = cleaned.replace(',', '.')

  // Try to cast the string to a number
  try {
    return Number(cleaned)
  } catch (e) {
    return undefined
  }
}

export const calculateInflow = (inflow?: number, outflow?: number) => {
  if (typeof inflow === 'undefined' && typeof outflow === 'undefined') {
    return undefined
  }

  if (typeof inflow !== 'undefined' && typeof outflow === 'undefined') {
    return inflow < 0 ? undefined : inflow
  }

  if (typeof inflow === 'undefined' && typeof outflow !== 'undefined') {
    return outflow < 0 ? -outflow : undefined
  }

  if (
    typeof inflow !== 'undefined' &&
    typeof outflow !== 'undefined' &&
    !(outflow === 0 || inflow === 0)
  ) {
    throw new Error("Inflow and outflow can't be set simultaneously")
  }
}

export const calculateOutflow = (inflow?: number, outflow?: number) => {
  if (typeof outflow === 'undefined' && typeof inflow === 'undefined') {
    return undefined
  }

  if (typeof outflow !== 'undefined' && typeof inflow === 'undefined') {
    return outflow < 0 ? undefined : outflow
  }

  if (typeof outflow === 'undefined' && typeof inflow !== 'undefined') {
    return inflow < 0 ? -inflow : undefined
  }

  if (
    typeof outflow !== 'undefined' &&
    typeof inflow !== 'undefined' &&
    !(outflow === 0 || inflow === 0)
  ) {
    throw new Error("Inflow and outflow can't be set simultaneously")
  }
}

export const generateParser = (config: ParserConfig) => {
  const columns = config.inputColumns.reduce(
    (acc, cur, index) => {
      if (cur === 'skip') {
        return acc
      }

      return {
        ...acc,
        [cur]: index,
      }
    },
    {} as { [k in keyof (YnabRow & { CDFlag?: string })]: number }
  )

  const hasCol = (name: keyof typeof columns) =>
    Object.keys(columns).includes(name)

  const match: MatcherFunction = async (file: File) => {
    const content = await readEncodedFile(file)
    const { data } = await parseCsv(content.trim())

    const match = file.name.match(new RegExp(`^${config.filenamePattern}`))

    if (!match) {
      return false
    }

    // Check that enough columns exist
    // Skip header rows in length check
    const headerRow = config.headerRows > 0 ? config.headerRows - 1 : 0
    if (
      data.length <= headerRow ||
      data[headerRow].length < config.inputColumns.length
    ) {
      return false
    }

    // Get all rows after the header row, filter empty lines, filter lines without a date (pending transactions), then use the first row of that
    const row = data.slice(config.headerRows).filter(d => d.length > 1).filter(d => d[columns.Date] != "")[0]

    // Check that the date column is set correctly
    try {
      if (!parseDate(row[columns.Date], config.dateFormat)) {
        return false
      }
    } catch (e) {
      return false
    }

    // Check that the payee column is not a date
    try {
      if (columns.Payee && parseDate(row[columns.Payee], config.dateFormat)) {
        return false
      }
    } catch (e) {}

    // Check that the inflow column is set correctly, if it exists
    if (columns.Inflow && isNaN(parseNumber(row[columns.Inflow]))) {
      return false
    }

    // Check that the outflow column is set correctly, if it exists
    if (columns.Outflow && isNaN(parseNumber(row[columns.Outflow]))) {
      return false
    }

    return true
  }

  const parse: ParserFunction = async (file: File) => {
    const content = await readEncodedFile(file)
    const { data } = await parseCsv(content.trim())

    const ynabData = data
      .slice(config.headerRows, data.length - config.footerRows) // Filter header and footer rows
      .filter(d => d.length > 1) // Filter empty lines
      .filter(d => d[columns.Date] != "") // Filter lines without date (pending transactions)
      .map(
        d =>
          ({
            Category: hasCol('Category') ? d[columns.Category] : undefined,
            Payee: hasCol('Payee') ? d[columns.Payee] : undefined,
            Date: hasCol('Date')
              ? ynabDate(parseDate(d[columns.Date], config.dateFormat))
              : undefined,
            ...(config.inflowOutflowFlag && hasCol('CDFlag')
              ? {
                  Inflow:
                    d[columns.CDFlag].trim() === config.inflowOutflowFlag[1]
                      ? parseNumber(d[columns.Inflow])
                      : undefined,
                  Outflow:
                    d[columns.CDFlag].trim() === config.inflowOutflowFlag[2]
                      ? parseNumber(d[columns.Inflow])
                      : undefined,
                }
              : {
                  Inflow: calculateInflow(
                    hasCol('Inflow')
                      ? parseNumber(d[columns.Inflow])
                      : undefined,
                    hasCol('Outflow')
                      ? parseNumber(d[columns.Outflow])
                      : undefined
                  ),
                  Outflow: calculateOutflow(
                    hasCol('Inflow')
                      ? parseNumber(d[columns.Inflow])
                      : undefined,
                    hasCol('Outflow')
                      ? parseNumber(d[columns.Outflow])
                      : undefined
                  ),
                }),
          }) as YnabRow
      )

    return [
      {
        data: ynabData,
      },
    ]
  }

  return {
    name: config.name,
    link: config.link,
    country: config.country,
    filenamePattern: new RegExp(config.filenamePattern),
    fileExtension: config.filenameExtension || 'csv',
    match,
    parse,
  } as ParserModule
}

const ignorelist = ['de N26', 'de ING-DiBa', 'ie N26']
export const bank2ynab = banks
  .filter(b => !ignorelist.includes(`${b.country} ${b.name}`))
  .map(bank => generateParser(bank as ParserConfig))
