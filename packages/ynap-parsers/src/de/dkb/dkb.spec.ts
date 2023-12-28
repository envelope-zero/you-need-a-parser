import fs from 'fs'
import { glob } from 'glob'
import { Dictionary } from 'lodash'
import path from 'path'
import { YnabFile } from '../..'
import { readEncodedFile } from '../../util/read-encoded-file'
import { dkb, generateYnabDate } from './dkb'

interface testData {
  file: File
  content: string
  result: YnabFile[]
}

const getTestData = async () => {
  let testData: Array<testData> = []

  const files = await glob('test-data/*', {
    absolute: true,
    cwd: __dirname,
  })

  for (const fileName of files) {
    const file = new File([fs.readFileSync(fileName)], path.basename(fileName))
    const data = {
      file: file,
      content: await readEncodedFile(file),
      result: null,
    }

    if (file.name in ynabResults) {
      data.result = ynabResults[file.name]
    } else {
      throw new Error(
        `No YnabFile test result found for ${file.name}. There has to be an entry for each test-data file in ynabResults.`
      )
    }

    testData.push(data)
  }

  return testData
}

const ynabResults: Dictionary<YnabFile[]> = {
  '07-11-2023_Umsatzliste_Girokonto-Abc_DE12345678901234567891.csv': [
    {
      data: [
        {
          Date: '11/06/2023',
          Payee: 'exampleIssuer',
          Memo: '2023-11-03 Debitk.95 VISA Debit',
          Outflow: '82.80',
          Inflow: undefined,
        },
        {
          Date: '09/28/2023',
          Payee: 'Someone Else',
          Memo: 'exampleNote',
          Outflow: undefined,
          Inflow: '2017.32',
        },
      ],
    },
  ],
  '28-12-2023_Umsatzliste_Gemeinschaftskonto_DE12345678901234567891.csv': [
    {
      data: [
        {
          Date: '12/28/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '11.79',
          Payee: 'Beispielempfaenger 13',
        },
        {
          Date: '12/27/2023',
          Inflow: '400.00',
          Memo: 'Beispiel Verwendungszweck',
          Outflow: undefined,
          Payee: 'Erika Mustermann und Max Mustermann',
        },
        {
          Date: '12/27/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '51.18',
          Payee: 'Beispielempfaenger 2',
        },
        {
          Date: '12/27/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '12.99',
          Payee: 'Beispielempfaenger 3',
        },
        {
          Date: '12/27/2023',
          Inflow: '1230.00',
          Memo: 'Gemeinschaftskonto',
          Outflow: undefined,
          Payee: 'MAX MUSTERMANN UND ERIKA MUSTERMANN',
        },
        {
          Date: '12/22/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '20.00',
          Payee: 'Beispielempfaenger 4',
        },
        {
          Date: '12/21/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '85.90',
          Payee: 'Beispielempfaenger 5',
        },
        {
          Date: '12/21/2023',
          Inflow: '200.00',
          Memo: '',
          Outflow: undefined,
          Payee: 'Max Mustermann',
        },
        {
          Date: '12/20/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '24.90',
          Payee: 'Beispielempfaenger 6',
        },
        {
          Date: '12/19/2023',
          Inflow: '150.00',
          Memo: '',
          Outflow: undefined,
          Payee: 'Max Mustermann und Erika Mustermann',
        },
        {
          Date: '12/19/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '110.13',
          Payee: 'Beispielempfaenger 7',
        },
        {
          Date: '12/18/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '54.99',
          Payee: 'Beispielempfaenger 6',
        },
        {
          Date: '12/18/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '97.99',
          Payee: 'Beispielempfaenger 5',
        },
        {
          Date: '12/18/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '34.20',
          Payee: 'Beispielempfaenger 13',
        },
        {
          Date: '12/15/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '9.30',
          Payee: 'Beispielempfaenger 7',
        },
        {
          Date: '12/14/2023',
          Inflow: '75.97',
          Memo: 'Beispiel Verwendungszweck',
          Outflow: undefined,
          Payee: 'Max Mustermann',
        },
        {
          Date: '12/14/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '35.00',
          Payee: 'Beispielempfaenger 7',
        },
        {
          Date: '12/13/2023',
          Inflow: '12.00',
          Memo: 'Beispiel Verwendungszweck',
          Outflow: undefined,
          Payee: 'Max Mustermann und Erika Mustermann',
        },
        {
          Date: '12/13/2023',
          Inflow: '12.00',
          Memo: 'Beispiel Verwendungszweck',
          Outflow: undefined,
          Payee: 'Max Mustermann und Erika Mustermann',
        },
        {
          Date: '12/13/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '6.99',
          Payee: 'BEISPIEL EMPF/AENGER//8',
        },
        {
          Date: '12/13/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '22.99',
          Payee: 'Beispielempfaenger 9',
        },
        {
          Date: '12/12/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '10.00',
          Payee: 'Beispielempfaenger 10',
        },
        {
          Date: '12/12/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '22.74',
          Payee: 'Beispielempfaenger 11',
        },
        {
          Date: '12/12/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '4.50',
          Payee: 'Beispielempfaenger 13',
        },
        {
          Date: '12/11/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '122.08',
          Payee: 'Beispielempfaenger 12',
        },
        {
          Date: '12/11/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '8.25',
          Payee: 'BEISPIELEMPFAENGER 13',
        },
        {
          Date: '12/07/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '6.75',
          Payee: 'Beispielempfaenger 14',
        },
        {
          Date: '12/07/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '95.77',
          Payee: 'Beispielempfaenger 15',
        },
        {
          Date: '12/06/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '18.37',
          Payee: 'Beispielempfaenger 16',
        },
        {
          Date: '12/05/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '55.98',
          Payee: 'Beispielempfaenger 17',
        },
        {
          Date: '12/05/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '55.00',
          Payee: 'Beispielempfaenger 18',
        },
        {
          Date: '12/05/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '12.99',
          Payee: 'Beispielempfaenger 19',
        },
        {
          Date: '12/04/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '24.00',
          Payee: 'Beispielempfaenger 20',
        },
        {
          Date: '12/04/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '23.89',
          Payee: 'Beispielempfaenger 21',
        },
        {
          Date: '12/04/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '49.00',
          Payee: 'Beispiel GmbH Beispielstr. 1',
        },
        {
          Date: '12/01/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '1020.00',
          Payee: 'Beispielempfaenger 22',
        },
        {
          Date: '12/01/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '49.00',
          Payee:
            'Beispielempfaenger Beispielempfaenger Beispielempfaenger Beispielempfaenger Beispielempfaenger 23',
        },
        {
          Date: '12/01/2023',
          Inflow: undefined,
          Memo: 'Beispiel Verwendungszweck',
          Outflow: '21.00',
          Payee: 'Beispielempfaenger 1',
        },
      ],
    },
  ],
}

describe('DKB', () => {
  let testData: Array<testData>
  beforeAll(async () => {
    testData = await getTestData()
  })

  describe('Matcher', () => {
    it('should match DKB files by file name', async () => {
      for (const test of testData) {
        const result2 = !!test.file.name.match(dkb.filenamePattern)
        expect(result2).toBe(true)
      }
    })

    it('should not match other files by file name', async () => {
      const invalidFile = new File([], 'test.csv')
      const result = await dkb.match(invalidFile)
      expect(result).toBe(false)
    })

    it('should match DKB files by fields', async () => {
      for (const test of testData) {
        const result = await dkb.match(test.file)
        expect(result).toBe(true)
      }
    })

    it('should not match empty files', async () => {
      const file = new File([], 'test.csv')
      const result = await dkb.match(file)
      expect(result).toBe(false)
    })
  })

  describe('Parser', () => {
    it('should parse data correctly', async () => {
      for (const test of testData) {
        const result = await dkb.parse(test.file)
        expect(result).toEqual(test.result)
      }
    })
  })

  describe('Date Converter', () => {
    it('should format an input date correctly', () => {
      expect(generateYnabDate('03.05.2018')).toEqual('05/03/2018')
      expect(generateYnabDate('3.05.2018')).toEqual('05/03/2018')
      expect(generateYnabDate('03.5.2018')).toEqual('05/03/2018')
      expect(generateYnabDate('3.5.2018')).toEqual('05/03/2018')
      expect(generateYnabDate('03.05.18')).toEqual('05/03/2018')
      expect(generateYnabDate('3.05.18')).toEqual('05/03/2018')
      expect(generateYnabDate('03.5.18')).toEqual('05/03/2018')
      expect(generateYnabDate('3.5.18')).toEqual('05/03/2018')
    })

    it('should throw an error when the input date is incorrect', () => {
      expect(() => generateYnabDate('1.1.1')).toThrow('not a valid date')
    })
  })
})
