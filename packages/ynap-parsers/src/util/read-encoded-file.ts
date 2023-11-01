import chardet from 'jschardet';
import { decode } from 'iconv-lite';
import { Buffer } from 'buffer';

export const readEncodedFile = (file: File, charset?: string): Promise<string> => {
  return new Promise((res) => {
    file.text().then((result) => {
      if (result == "") {
        return res('');
      }

      if (!charset) {
        const detectedCharset = chardet.detect(result);
        charset = detectedCharset ? detectedCharset.encoding : 'utf-8';
      }

      const decoded = decode(Buffer.from(result, 'binary'), charset);
      return res(decoded);
    })
  })
};
