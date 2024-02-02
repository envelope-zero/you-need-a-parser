import { generateYnabDate, tradeRepublic } from './trade-republic'
import { YnabFile } from '../..'
import { encode } from 'iconv-lite'

const content = encode(
  `[
    {
      "id": "3af95aed-76a9-4142-9c9b-d4fb2598e013",
      "timestamp": "2024-02-04T15:56:33.375+0000",
      "title": "Zinsen",
      "icon": "logos/timeline_interest_new/v2",
      "badge": null,
      "subtitle": null,
      "amount": { "currency": "EUR", "value": 10, "fractionDigits": 2 },
      "subAmount": null,
      "status": "EXECUTED",
      "action": {
        "type": "timelineDetail",
        "payload": "3af95aed-76a9-4142-9c9b-d4fb2598e013"
      },
      "eventType": "INTEREST_PAYOUT_CREATED"
    }
  ]`,
  'utf-8'
)

const ynabResult: YnabFile[] = [
  {
    data: [
      {
        Date: '02/04/2024',
        Payee: 'Zinsen',
        Inflow: 10,
      },
    ],
  },
]

describe('trade-republic Parser Module', () => {
  describe('Matcher', () => {
    it('should match trade-republic files by file name', async () => {
      const fileName = 'transactions.json'
      const result = !!fileName.match(tradeRepublic.filenamePattern)
      expect(result).toBe(true)
    })

    it('should not match other files by file name', async () => {
      const invalidFile = new File([], 'test.json')
      const result = await tradeRepublic.match(invalidFile)
      expect(result).toBe(false)
    })

    it('should match trade-republic files by fields', async () => {
      const file = new File([content], 'test.json')
      const result = await tradeRepublic.match(file)
      expect(result).toBe(true)
    })

    it('should not match empty files', async () => {
      const file = new File([], 'test.json')
      const result = await tradeRepublic.match(file)
      expect(result).toBe(false)
    })
  })

  describe('Parser', () => {
    it('should parse data correctly', async () => {
      const file = new File([content], 'test.json')
      const result = await tradeRepublic.parse(file)
      expect(result).toEqual(ynabResult)
    })
  })

  describe('Date Converter', () => {
    it('should format an input date correctly', () => {
      expect(generateYnabDate('2024-02-01')).toEqual('02/01/2024')
    })

    it('should throw an error when the input date is incorrect', () => {
      expect(() => generateYnabDate('2024-01')).toThrow('not a valid date')
    })
  })
})
