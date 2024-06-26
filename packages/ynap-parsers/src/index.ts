import 'mdn-polyfills/String.prototype.padStart'
import { unparse } from 'papaparse'

import last from 'lodash/last'
import uniq from 'lodash/uniq'

import { _1822direkt } from './de/1822direkt/1822direkt'
import { comdirect } from './de/comdirect/comdirect'
import { ingDiBa } from './de/ing-diba/ing-diba'
import { kontist } from './de/kontist/kontist'
import { n26 } from './de/n26/n26'
import { outbank } from './de/outbank/outbank'
import { volksbankEG } from './de/volksbank-eg/volksbank-eg'
import { tradeRepublic } from './de/trade-republic/trade-republic'
import { ingAustria } from './at/ing/ing-austria'
import { piraeus } from './gr/piraeus/piraeus'
import { bancomer } from './mx/bbva-bancomer/bbva-bancomer'
import { aqua } from './uk/aqua/aqua'
import { marcus } from './uk/marcus/marcus'
import { sparbankenTanum as sparbankenTanum2018 } from './se/sparbanken-tanum/2018/sparbanken-tanum'
import { sparbankenTanum as sparbankenTanum2019 } from './se/sparbanken-tanum/2019/sparbanken-tanum'
import { bank2ynab } from './bank2ynab/bank2ynab'
import { mt940 } from './international/mt940/mt940'
import { revolut } from './international/revolut/revolut'
import { dkb } from './de/dkb/dkb'
import { bankPocztowy } from './pl/bank-pocztowy/bank-pocztowy'
import { mbank } from './pl/mbank/mbank'
import { seb } from './se/seb-privat/seb'

export interface YnabRow {
  Date?: string
  Payee?: string
  Category?: string
  Memo?: string
  Outflow?: number | string
  Inflow?: number | string
}

export interface YnabFile {
  accountName?: string
  data: YnabRow[]
}

export interface ParserModule {
  name: string
  country: string
  link: string
  fileExtension: string
  filenamePattern: RegExp
  match: MatcherFunction
  parse: ParserFunction
}

export type MatcherFunction = (file: File) => Promise<boolean>
export type ParserFunction = (file: File) => Promise<YnabFile[]>

export const parsers: ParserModule[] = [
  // AT
  ingAustria,

  // DE
  outbank,
  n26,
  ingDiBa,
  comdirect,
  kontist,
  volksbankEG,
  _1822direkt,
  dkb,
  tradeRepublic,

  // GR
  piraeus,

  // MX
  bancomer,

  // SE
  sparbankenTanum2018,
  sparbankenTanum2019,
  seb,

  // UK
  marcus,
  aqua,

  // PL
  mbank,
  bankPocztowy,

  // International
  revolut,
  mt940,
  ...bank2ynab,
]

export const countries = uniq(
  parsers.filter(p => p.country.length === 2).map(p => p.country)
)

export const matchFile = async (file: File): Promise<ParserModule[]> => {
  if (file.name.match(/^(.+)-ynap\.csv$/)) {
    throw new Error('This file has already been converted by YNAP.')
  }

  const filenameMatches = parsers.filter(p =>
    file.name.match(p.filenamePattern)
  )

  // If parser modules match the file by its filename, try those first
  if (filenameMatches.length > 0) {
    const parsers = (
      await Promise.all(
        filenameMatches.map(async p => ({
          parser: p,
          matched: await p.match(file),
        }))
      )
    )
      .filter(r => r.matched)
      .map(p => p.parser)

    if (parsers.length > 0) {
      return parsers
    }
  }

  // If they don't, run all matchers against the input file
  const results = (
    await Promise.all(
      parsers
        .filter(
          p =>
            p.fileExtension.toLowerCase() ===
            last(file.name.split('.')).toLowerCase()
        )
        .map(async p => ({
          parser: p,
          matched: await p.match(file),
        }))
    )
  )
    .filter(r => r.matched)
    .map(p => p.parser)

  return results
}

export const parseFile = async (file: File, parserOverride?: ParserModule) => {
  let parser: ParserModule | null = null

  if (parserOverride) {
    parser = parserOverride
  } else {
    const matches = await matchFile(file)
    console.log(
      'The file',
      file.name,
      'was matched by',
      matches.map(m => m.name).join(', ')
    )
    parser = matches.length > 0 ? matches[0] : null
  }

  if (!parser) {
    throw new Error(`No parser is available for this file.`)
  }

  const ynabData = await parser.parse(file)

  return ynabData.map(f => ({
    ...f,
    data: unparse(f.data),
    rawData: f.data,
    matchedParser: parser,
  }))
}
