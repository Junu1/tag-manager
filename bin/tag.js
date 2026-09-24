#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { Command } from 'commander';
import chalk from 'chalk';

import { getCurrentVersion, getScheme, bumpVersion, buildTagName, updatePackageFiles } from '../lib/version.js';
import { ensureGitRepo, ensureCleanWorkingTree, tagExists, createTag, commitFiles, getTagHistory } from '../lib/git.js';
import { info, success, error, dim, printVersion, promptMenu, confirm, pressEnter, divider, banner } from '../lib/ui.js';

// ─── Core actions ────────────────────────────────────────────────────

/**
 * Execute a version bump: update files, commit, and create a git tag.
 * @param {'product'|'major'|'minor'|'patch'|'maintenance'|'hotfix'} type
 * @param {object} options
 * @param {string}  [options.prefix]       Optional project prefix
 * @param {boolean} [options.skipConfirm]  Skip the confirmation prompt
 */
async function doBump(type, { prefix, skipConfirm = false } = {}) {
    ensureGitRepo();
    ensureCleanWorkingTree();

    const currentVersion = getCurrentVersion();
    const newVersion = bumpVersion(type, currentVersion);
    const tagName = buildTagName(newVersion, prefix);

    // Ensure the tag doesn't already exist
    if (tagExists(tagName)) {
        error(`Tag ${chalk.bold(tagName)} already exists.`);
        process.exit(1);
    }

    console.log('');
    printVersion('Current version:', currentVersion);
    printVersion('New version:    ', newVersion);
    if (prefix) info(`Tag prefix:      ${chalk.bold(prefix)}`);
    console.log(`${chalk.blue('Tag name:        ')}${chalk.green.bold(tagName)}`);
    console.log('');

    // Confirm unless skipped (CLI mode skips by default)
    if (!skipConfirm) {
        const ok = await confirm('Proceed with version bump?');
        if (!ok) {
            error('Operation cancelled.');
            return;
        }
    }

    // 1. Update package files
    updatePackageFiles(newVersion);
    success(`✔ Updated package.json → ${newVersion}`);

    // 2. Commit changes
    const filesToCommit = ['package.json'];
    if (existsSync('package-lock.json')) filesToCommit.push('package-lock.json');
    commitFiles(filesToCommit, tagName);
    success(`✔ Committed: ${tagName}`);

    // 3. Create annotated git tag
    createTag(tagName, tagName);
    success(`✔ Created tag: ${tagName}`);

    console.log('');
    divider();
    success(`✨ Version ${chalk.bold(tagName)} created locally!`);
    divider();
    console.log('');
    info('To publish this version:');
    dim(`  1. Review your changes`);
    dim(`  2. git push origin <branch>`);
    dim(`  3. git push origin ${tagName}`);
    console.log('');
}

/**
 * Display version history (recent git tags).
 */
function doHistory() {
    ensureGitRepo();
    const tags = getTagHistory(15);

    console.log('');
    if (tags.length === 0) {
        dim('No tags found in this repository.');
    } else {
        info(`Version history (last ${tags.length} tags):`);
        console.log('');
        tags.forEach((tag, i) => {
            const marker = i === 0 ? chalk.green('→') : chalk.dim('·');
            const text = i === 0 ? chalk.green.bold(tag) : chalk.white(tag);
            console.log(`  ${marker} ${text}`);
        });
    }
    console.log('');
}

// ─── Interactive mode ────────────────────────────────────────────────

async function interactiveMode() {
    ensureGitRepo();

    while (true) {
        console.clear();
        banner('Tag Manager');
        const currentVersion = getCurrentVersion();
        printVersion('Current version:', currentVersion);
        console.log('');

        const action = await promptMenu(getScheme(currentVersion));

        if (action === 'exit') {
            console.log('');
            info('Goodbye! 👋');
            console.log('');
            break;
        }

        if (action === 'history') {
            doHistory();
            await pressEnter();
            continue;
        }

        // a bump level from the current version's scheme
        await doBump(action, { skipConfirm: false });
        await pressEnter();
    }
}

// ─── CLI definition ──────────────────────────────────────────────────

const { version: CLI_VERSION } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const program = new Command();

program
    .name('tag')
    .description('A cross-platform CLI for managing semantic versioning tags in Git repositories.')
    .version(CLI_VERSION, '-v, --version', 'Display the CLI version');

// 3-digit versions use: major, minor, patch
// 5-digit versions use: product, major, minor, maintenance, hotfix
const BUMP_COMMANDS = [
    ['product', 'Bump product version (X.0.0.0.0) — 5-digit only'],
    ['major', 'Bump major version (X.0.0 or x.X.0.0.0) — breaking changes'],
    ['minor', 'Bump minor version (x.X.0 or x.x.X.0.0) — new features'],
    ['patch', 'Bump patch version (x.x.X) — 3-digit only'],
    ['maintenance', 'Bump maintenance version (x.x.x.X.0) — 5-digit only'],
    ['hotfix', 'Bump hotfix version (x.x.x.x.X) — 5-digit only'],
];

for (const [type, description] of BUMP_COMMANDS) {
    program
        .command(`${type} [prefix]`)
        .description(description)
        .action((prefix) => doBump(type, { prefix, skipConfirm: true }));
}

program
    .command('history')
    .description('View recent version history')
    .action(() => doHistory());

// If no subcommand is provided, run interactive mode
program.action(() => interactiveMode());

program.parse();
