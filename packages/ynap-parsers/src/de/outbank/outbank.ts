import 'mdn-polyfills/String.prototype.startsWith';
import { ParserFunction, MatcherFunction, ParserModule, YnabRow } from '../..';
import { parse } from '../../util/papaparse';
import iban from 'iban';
import slugify from 'slugify';

export interface OutbankRow {
  '#': string;
  Account?: string;
  Date?: string;
  'Value Date'?: string;
  Amount?: string;
  Currency?: string;
  Name?: string;
  Number?: string;
  Bank?: string;
  Reason?: string;
  Category?: string;
  Subcategory?: string;
  Tags?: string;
  Note?: string;
  'Bank name'?: string;
  'Ultimate Receiver Name'?: string;
  'Original Amount'?: string;
  'Compensation Amount'?: string;
  'Exchange Rate'?: string;
  'Posting Key'?: string;
  'Posting Text'?: string;
  'Purpose Code'?: string;
  'SEPA Reference'?: string;
  'Client Reference'?: string;
  'Mandate Identification'?: string;
  'Originator Identifier'?: string;
}

export const generateYnabDate = (input: string) => {
  const match = input.match(/(\d{1,2})\/(\d{1,2})\/(\d{1,2})/);

  if (!match) {
    throw new Error('The input is not a valid date. Expected format: M/D/Y');
  }

  const [, month, day, year] = match;
  return [month.padStart(2, '0'), day.padStart(2, '0'), `20${year}`].join('/');
};

export const parseNumber = (input: string) => Number(input.replace(',', '.'));

export const outbankParser: ParserFunction = async (file: File) => {
  const { data } = await parse(file, { header: true });
  const banks = (await import('./blz.json')).default;

  const groupedData = (data as OutbankRow[])
    .filter((r) => r.Date && r.Amount)
    .reduce(
      (acc, cur) => {
        const data = {
          Date: generateYnabDate(cur.Date!),
          Payee: cur.Name || cur.Reason,
          Category: cur.Category,
          Memo: cur.Reason,
          Outflow:
            parseNumber(cur.Amount!) < 0
              ? Math.abs(parseNumber(cur.Amount!)).toFixed(2)
              : undefined,
          Inflow:
            parseNumber(cur.Amount!) > 0
              ? parseNumber(cur.Amount!).toFixed(2)
              : undefined,
        };

        const key = cur.Account || 'no-account';

        if (Object.keys(acc).includes(key)) {
          acc[key].push(data);
        } else {
          acc[key] = [data];
        }

        return acc;
      },
      {} as { [k: string]: YnabRow[] },
    );

  const getBankSlug = (key: string) =>
    banks[key.substr(4, 8)]
      ? slugify(banks[key.substr(4, 8)]).toLowerCase()
      : 'unknown';

  return Object.keys(groupedData).map((key) => ({
    accountName: iban.isValid(key) ? getBankSlug(key) : key,
    data: groupedData[key],
  }));
};

export const outbankMatcher: MatcherFunction = async (file: File) => {
  const requiredKeys = [
    '#',
    'Account',
    'Date',
    'Value Date',
    'Amount',
    'Currency',
    'Name',
    'Number',
    'Bank',
    'Reason',
    'Category',
  ];

  const { data } = await parse(file, { header: true });

  if (data.length === 0) {
    return false;
  }

  const keys = Object.keys(data[0]);
  const missingKeys = requiredKeys.filter((k) => !keys.includes(k));

  if (missingKeys.length === 0) {
    return true;
  }

  return false;
};

export const outbank: ParserModule = {
  name: 'Outbank',
  country: 'de',
  fileExtension: 'csv',
  filenamePattern: /^Outbank_Export_(\d{8})\.csv/,
  link: 'https://help.outbankapp.com/en/kb/articles/wie-kann-ich-ums-tze-als-csv-datei-exportieren',
  match: outbankMatcher,
  parse: outbankParser,
};
