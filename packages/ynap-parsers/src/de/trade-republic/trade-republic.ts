import 'mdn-polyfills/String.prototype.startsWith'
import { ParserFunction, MatcherFunction, ParserModule } from '../..'
import { readEncodedFile } from '../../util/read-encoded-file'

export interface TradeRepublicEntry {
  timestamp: string
  title: string
  amount: {
    value: number
  }
  eventType: string
}

export const generateYnabDate = (input: string) => {
  const match = input.match(/(\d{4})\-(\d{2})\-(\d{2})/)

  if (!match) {
    throw new Error(
      'The input is not a valid date. Expected format: YYYY-MM-DD'
    )
  }

  const [, year, month, day] = match
  return [month.padStart(2, '0'), day.padStart(2, '0'), year].join('/')
}

export const tradeRepublicParser: ParserFunction = async (file: File) => {
  const fileString = await readEncodedFile(file)
  const data = await JSON.parse(fileString)

  return [
    {
      data: (data as TradeRepublicEntry[])
        .filter(
          // German "Vorabpauschale" is deducted from the asset value directly
          r => r.eventType != 'PRE_DETERMINED_TAX_BASE' && r.amount.value != 0
        )
        .map(r => ({
          Date: generateYnabDate(r.timestamp),
          Outflow: r.amount.value < 0 ? -r.amount.value : undefined,
          Inflow: r.amount.value > 0 ? r.amount.value : undefined,

          // Savings plans have the target asset as title, but we want it as a "Portfolio" account
          Payee:
            r.eventType === 'SAVINGS_PLAN_EXECUTED'
              ? 'Trade Republic Portfolio'
              : r.title,
          Memo: r.eventType === 'SAVINGS_PLAN_EXECUTED' ? r.title : undefined,
        })),
    },
  ]
}

export const tradeRepublicMatcher: MatcherFunction = async (file: File) => {
  const rawFileString = await readEncodedFile(file)

  try {
    const data = await JSON.parse(rawFileString)
    const first = data[0]
    if (generateYnabDate(first.timestamp) && first.eventType) {
      return true
    }

    return false
  } catch {
    return false
  }
}

export const tradeRepublic: ParserModule = {
  name: 'trade-republic',
  country: 'de',
  fileExtension: 'json',
  filenamePattern: /^transactions.json$/,
  link: 'https://traderepublic.com',
  match: tradeRepublicMatcher,
  parse: tradeRepublicParser,
}
