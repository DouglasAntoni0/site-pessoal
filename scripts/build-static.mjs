import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import sharp from 'sharp';
import { renderMainProjects, renderVolunteer, renderCertificates } from './render-content.mjs';
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
function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

async function loadSkillIcons() {
    const icons = new Map();
    for (const skill of skillGroups.flatMap(group => group.skills)) {
        const svg = (await fs.readFile(path.join(src, 'assets/icons/skills', `${skill.icon}.svg`), 'utf8')).trim();
        if (!svg.startsWith('<svg ') || !svg.endsWith('</svg>') || /<(?:use|image|script|foreignObject|filter)\b|\s(?:href|id|style)=/i.test(svg)) {
            throw new TypeError(`Skill icon must be a self-contained vector: ${skill.icon}`);
        }
        icons.set(skill.icon, svg.replace('<svg ', '<svg class="skill-icon" aria-hidden="true" focusable="false" '));
    }
    return icons;
}

function renderSkillGroups(icons) {
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
                ${skillGroup.skills.map((skill) => {
                    return `<span class="tech-tag skill-chip tone-${skill.tone}" data-skill-id="${escapeHtml(skill.id)}">${icons.get(skill.icon)}<span class="skill-label">${escapeHtml(skill.label)}</span></span>`;
                }).join('')}
            </div>
        </article>`).join('');
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
    chunkNames: 'build/[name]-[hash]',
    assetNames: 'build/[name]-[hash]',
    bundle: true,
    splitting: true,
    minify: true,
    metafile: true,
    sourcemap: 'external',
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
    __SKILLS__: renderSkillGroups(await loadSkillIcons()),
    __PROJECTS__: renderMainProjects(),
    __VOLUNTEER__: renderVolunteer(),
    __CERTIFICATES__: renderCertificates()
};

let html = await fs.readFile(path.join(src, 'index.html'), 'utf8');
for (const [token, value] of Object.entries(replacements)) {
    if (!html.includes(token)) throw new Error(`Missing HTML placeholder ${token}`);
    html = html.replaceAll(token, value);
}
// The template contains no preformatted text; code samples are populated on demand.
// Drop indentation while preserving whitespace between inline elements.
await fs.writeFile(path.join(dist, 'index.html'), html.replace(/^[\t ]+/gm, '').replace(/>\s+</g, '> <'));

await copyIfExists(path.join(root, 'assets'), path.join(dist, 'assets'));
await buildCertificatePreviews();
await copyIfExists(path.join(src, 'assets/icons'), path.join(dist, 'assets/icons'));
await copyIfExists(path.join(src, 'assets/fonts/Inter-OFL.txt'), path.join(dist, 'assets/fonts/Inter-OFL.txt'));
await copyIfExists(path.join(src, 'assets/fonts/SpaceGrotesk-OFL.txt'), path.join(dist, 'assets/fonts/SpaceGrotesk-OFL.txt'));

const commit = process.env.COMMIT_REF || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true }).trim();
await fs.writeFile(path.join(dist, 'deployment.json'), JSON.stringify({ commit }));
console.log('Static production site built in dist/.');
