import { spawnSync } from 'node:child_process';
import { publicSite } from '../tests/support/public-site.mjs';

const result = spawnSync('python', ['-m', 'robot', '--outputdir', 'artifacts/robot',
  '--variable', 'BASE_URL:' + publicSite(), 'tests/robot/site.robot'],
{ stdio: 'inherit', windowsHide: true });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
