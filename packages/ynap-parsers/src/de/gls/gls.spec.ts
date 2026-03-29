import fs from 'fs'
import { glob } from 'glob'
import { Dictionary } from 'lodash'
import path from 'path'
import { YnabFile } from '../..'
import { readEncodedFile } from '../../util/read-encoded-file'
import { generateYnabDate, gls } from './gls'

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
  // Girokonto
  'Umsaetze_DE81430609670123456789_2026.02.28.csv': [
    {
      data: [
	{
	  Date: '02/28/2026',
	  Memo: 'Abschluss per 28.02.2026',
	  Payee: 'GLS Gemeinschaftsbank eG', // Abschluss can mean account fee, interest payout or overdraft fees to/from bank
	  Category: 'Abschluss',
	  Inflow: undefined,
	  Outflow: '3.80',
	},
	{
	  Date: '02/27/2026',
	  Memo: 'MASTERCARD Abrechnung EREF: KKM12345678912345678912 MREF: DZ1234567891234567891234 CRED: DE0212345678901234 IBAN: DE20430609679919810800 BIC: GENODEM1GLS',
	  Payee: 'GLS Gemeinschaftsbank eG',
	  Category: 'Basislastschrift',
	  Inflow: undefined,
	  Outflow: '1522.79',
	},
	{
	  Date: '02/24/2026',
	  Memo: 'INSTANT TRANSFER EREF: 12345678912345678',
	  Payee: 'PAYPAL',
	  Category: 'Überweisungsgutschr.',
	  Inflow: '228.25',
	  Outflow: undefined,
	},
	{
	  Date: '02/23/2026',
	  Memo: 'Abo /*DA-3* IBAN: DE18430609679876543210 BIC: GENODEM1GLS',
	  Payee: 'Muster Mensch',
	  Category: 'Dauerauftragsbelast',
	  Inflow: undefined,
	  Outflow: '5.50',
	},
	{
	  Date: '02/12/2026',
	  Memo: 'Restaurant',
	  Payee: 'Muster Mensch',
	  Category: 'Überweisungsauftrag',
	  Inflow: undefined,
	  Outflow: '10.50',
	},
	{
	  Date: '01/29/2026',
	  Memo: 'PAYROLL     12345678/202601',
	  Payee: 'Muster Firma',
	  Category: 'Lohn/Gehalt/Rente',
	  Inflow: '1234.56',
	  Outflow: undefined,
	},
	{
	  Date: '02/01/2026',
	  Memo: 'Einkaeufe',
	  Payee: 'Muster Mensch',
	  Category: 'Überweisungsauftrag',
	  Inflow: undefined,
	  Outflow: '45.67',
	},
      ],
    },
  ],
  // Kreditkartenkonto
  'Umsaetze_DE83430609671234567891_2026.02.28.csv': [
    {
      data: [
	{
	  Date: '02/26/2026',
	  Memo: 'Abrechnung vom 18.02.2026  MC Hauptkarte',
	  Payee: '', // Memo only says Abrechnung, should be somehow mapped to main account
	  Category: 'Überweisungsgutschr.',
	  Inflow: '3456.78',
	  Outflow: undefined,
	},
	{
	  Date: '02/26/2026',
	  Memo: 'Muster Firma GmbH     DEU Berlin                 EUR            139,00      Umsatz vom 25.02.2026      MC Hauptkarte',
	  Payee: 'Muster Firma GmbH',
	  Category: 'Basislastschrift',
	  Inflow: undefined,
	  Outflow: '139.00',
	},
	{
	  Date: '02/16/2026',
	  Memo: 'SERVICE SUBSCRIPTION        USA ANN ARBOR              USD              3,00      KURS:      1,185771        1,75% AUSLANDSUMS.     0,04Umsatz vom 13.02.2026      MC Hauptkarte',
	  Payee: 'SERVICE SUBSCRIPTION',
	  Category: 'Basislastschrift',
	  Inflow: undefined,
	  Outflow: '2.57',
	},
      ],
    },
  ],
  // Tagesgeldkonto
  'Umsaetze_DE56430609671234567892_2026.02.28.csv': [
    {
      data: [
	{
	  Date: '02/27/2026',
	  Memo: 'Steuerrückzahlung',
	  Payee: 'Name Kontoinhaber*in',
	  Category: 'Überweisungsgutschr.',
	  Inflow: '3456.78',
	  Outflow: undefined,
	},
	{
	  Date: '01/02/2026',
	  Memo: 'Sparbuch',
	  Payee: 'Name Kontoinhaber*in',
	  Category: 'Dauerauftragsgutschr',
	  Inflow: '678.90',
	  Outflow: undefined,
	},
	{
	  Date: '12/31/2025',
	  Memo: 'Abschluss per 31.12.2025',
	  Payee: 'GLS Gemeinschaftsbank eG', // Abschluss means payout of interest by bank
	  Category: 'Abschluss',
	  Inflow: '56.78',
	  Outflow: undefined,
	},
      ],
    },
  ],
}

describe('GLS', () => {
  let testData: Array<testData>
  beforeAll(async () => {
    testData = await getTestData()
  })

  describe('Matcher', () => {
    it('should match GLS files by file name', async () => {
      for (const test of testData) {
	const result2 = !!test.file.name.match(gls.filenamePattern)
	expect(result2).toBe(true)
      }
    })

    it('should not match other files by file name', async () => {
      const invalidFile = new File([], 'test.csv')
      const result = await gls.match(invalidFile)
      expect(result).toBe(false)
    })

    it('should match GLS files by fields', async () => {
      for (const test of testData) {
	const result = await gls.match(test.file)
	expect(result).toBe(true)
      }
    })

    it('should not match empty files', async () => {
      const file = new File([], 'test.csv')
      const result = await gls.match(file)
      expect(result).toBe(false)
    })
  })

  describe('Parser', () => {
    it('should parse data correctly', async () => {
      for (const test of testData) {
	const result = await gls.parse(test.file)
	expect(result).toEqual(test.result)
      }
    })
  })

  describe('Date Converter', () => {
    it('should format an input date correctly', () => {
      expect(generateYnabDate('03.05.2018')).toEqual('05/03/2018')
    })

    it('should throw an error when the input date is incorrect', () => {
      expect(() => generateYnabDate('1.1.1')).toThrow('not a valid date')
    })
  })
})
