import { matchFile } from '.';
import { glob } from 'glob'
import fs from 'fs';
import path from 'path';

describe('Main Module', () => {
  it('should match only one parser for each test file', async () => {
    const files = await glob('**/test-data/*', { absolute: true, cwd: __dirname });
    for (const fileName of files) {
      const file = new File([fs.readFileSync(fileName)], path.basename(fileName));
      const matches = await matchFile(file);

      if (matches.length === 0) {
        console.error('No parsers for', fileName);
      }

      if (matches.length > 1) {
        console.warn('Multiple parsers for', fileName);
        console.warn(matches.map((m) => m.name));
      }
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }
  });
});
