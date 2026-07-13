import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import sharp from 'sharp';
import * as simpleIcons from 'simple-icons';
import { skillGroups } from '../src/data/skills.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');
const assetOutdir = path.join(dist, 'assets');

async function copyIfExists(source, target) {
    try {
        const stat = await fs.stat(source);
        await fs.mkdir(path.dirname(target), { recursive: true });
        if (stat.isDirectory()) {
            await fs.cp(source, target, { recursive: true, force: true });
        } else {
            await fs.copyFile(source, target);
        }
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
}


async function buildCertificatePreviews() {
    const sourceDir = path.join(root, 'assets/certificates');
    const targetDir = path.join(dist, 'assets/certificates/previews');
    await fs.mkdir(targetDir, { recursive: true });
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    await Promise.all(entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.png'))
        .map((entry) => sharp(path.join(sourceDir, entry.name))
            .resize({ width: 1600, height: 1000, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82, smartSubsample: true })
            .toFile(path.join(targetDir, entry.name.replace(/\.png$/i, '.webp')))));
}

function outputUrl(outputPath) {
    const absolute = path.isAbsolute(outputPath) ? outputPath : path.resolve(root, outputPath);
    return path.relative(dist, absolute).replaceAll('\\', '/');
}
const brandIcons = {
    'brand-nodedotjs': 'siNodedotjs',
    'brand-typescript': 'siTypescript',
    'brand-python': 'siPython',
    'brand-ruby': 'siRuby',
    'brand-dotnet': 'siDotnet',
    'brand-php': 'siPhp',
    'brand-go': 'siGo',
    'brand-html5': 'siHtml5',
    'brand-css': 'siCss',
    'brand-react': 'siReact',
    'brand-json': 'siJson',
    'brand-xml': 'siXml',
    'brand-yaml': 'siYaml',
    'brand-markdown': 'siMarkdown',
    'brand-dotenv': 'siDotenv',
    'brand-cypress': 'siCypress',
    'brand-webdriverio': 'siWebdriverio',
    'brand-selenium': 'siSelenium',
    'brand-jest': 'siJest',
    'brand-mocha': 'siMocha',
    'brand-pytest': 'siPytest',
    'brand-robotframework': 'siRobotframework',
    'brand-faker': 'siFaker',
    'brand-postman': 'siPostman',
    'brand-insomnia': 'siInsomnia',
    'brand-swagger': 'siSwagger',
    'brand-postgresql': 'siPostgresql',
    'brand-mongodb': 'siMongodb',
    'brand-k6': 'siK6',
    'brand-apachejmeter': 'siApachejmeter',
    'brand-appium': 'siAppium',
    'brand-androidstudio': 'siAndroidstudio',
    'brand-git': 'siGit',
    'brand-githubactions': 'siGithubactions',
    'brand-gitlab': 'siGitlab',
    'brand-jenkins': 'siJenkins',
    'brand-docker': 'siDocker',
    'brand-jira': 'siJira',
    'brand-trello': 'siTrello',
    'brand-cucumber': 'siCucumber'
};
const lightBrandIcons = new Set(['brand-json', 'brand-markdown', 'brand-robotframework']);

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function renderSkillGroups() {
    return skillGroups.map((skillGroup, groupIndex) => `
        <article class="skill-group glass-panel reveal tone-${skillGroup.tone}" data-skill-group="${escapeHtml(skillGroup.id)}">
            <div class="skill-group-header">
                <span class="skill-group-number" aria-hidden="true">0${groupIndex + 1}</span>
                <div>
                    <h3>${escapeHtml(skillGroup.title)}</h3>
                    <p>${escapeHtml(skillGroup.description)}</p>
                </div>
            </div>
            <div class="skill-list">
                ${skillGroup.skills.map((skill) => `<span class="tech-tag skill-chip tone-${skill.tone}" data-skill-id="${escapeHtml(skill.id)}"><svg class="skill-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/icons/sprite.svg#${escapeHtml(skill.icon)}"></use></svg><span>${escapeHtml(skill.label)}</span></span>`).join('')}
            </div>
        </article>`).join('');
}

async function buildIconSprite() {
    const spritePath = path.join(src, 'assets/icons/sprite.svg');
    const targetPath = path.join(dist, 'assets/icons/sprite.svg');
    const sourceSprite = await fs.readFile(spritePath, 'utf8');
    const brandSymbols = Object.entries(brandIcons).map(([id, exportName]) => {
        const icon = simpleIcons[exportName];
        if (!icon?.path || !icon?.hex) throw new TypeError(`Missing brand icon: ${exportName}`);
        const color = lightBrandIcons.has(id) ? 'F8FAFC' : icon.hex;
        return `  <symbol id="${id}" viewBox="0 0 24 24"><path fill="#${color}" d="${icon.path}"/></symbol>`;
    }).join('\n');
    const sprite = sourceSprite.replace('</svg>', `${brandSymbols}\n</svg>`);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, sprite);
}

await fs.rm(dist, { recursive: true, force: true });
await fs.mkdir(assetOutdir, { recursive: true });

const result = await build({
    entryPoints: {
        app: path.join(src, 'scripts/main.js'),
        styles: path.join(src, 'styles/index.css')
    },
    outdir: assetOutdir,
    entryNames: 'build/[name]-[hash]',
    assetNames: 'build/[name]-[hash]',
    bundle: true,
    minify: true,
    metafile: true,
    sourcemap: false,
    target: ['es2018'],
    format: 'esm',
    loader: { '.woff2': 'file' },
    legalComments: 'none',
    logLevel: 'info'
});

const outputs = Object.entries(result.metafile.outputs);
const findEntry = (suffix) => {
    const match = outputs.find(([, info]) => info.entryPoint?.replaceAll('\\', '/').endsWith(suffix));
    if (!match) throw new Error(`Missing build output for ${suffix}`);
    return outputUrl(match[0]);
};
const findAsset = (name) => {
    const match = outputs.find(([output]) => path.basename(output).startsWith(`${name}-`) && output.endsWith('.woff2'));
    if (!match) throw new Error(`Missing font output for ${name}`);
    return outputUrl(match[0]);
};

const replacements = {
    __APP_JS__: findEntry('/scripts/main.js'),
    __APP_CSS__: findEntry('/styles/index.css'),
    __INTER_FONT__: findAsset('inter-latin'),
    __SPACE_FONT__: findAsset('space-grotesk-latin'),
    __SKILLS__: renderSkillGroups()
};

let html = await fs.readFile(path.join(src, 'index.html'), 'utf8');
for (const [token, value] of Object.entries(replacements)) {
    if (!html.includes(token)) throw new Error(`Missing HTML placeholder ${token}`);
    html = html.replaceAll(token, value);
}
await fs.writeFile(path.join(dist, 'index.html'), html);

await copyIfExists(path.join(root, 'assets'), path.join(dist, 'assets'));
await buildCertificatePreviews();
await copyIfExists(path.join(src, 'assets/icons'), path.join(dist, 'assets/icons'));
await buildIconSprite();
await copyIfExists(path.join(src, 'assets/fonts/Inter-OFL.txt'), path.join(dist, 'assets/fonts/Inter-OFL.txt'));
await copyIfExists(path.join(src, 'assets/fonts/SpaceGrotesk-OFL.txt'), path.join(dist, 'assets/fonts/SpaceGrotesk-OFL.txt'));

console.log('Static production site built in dist/.');
