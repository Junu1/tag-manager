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
 * @param {3|5} digits  Digit count of the new version
 * @param {object} options
 * @param {string}  [options.prefix]       Optional project prefix
 * @param {boolean} [options.skipConfirm]  Skip the confirmation prompt
 */
async function doBump(type, digits, { prefix, skipConfirm = false } = {}) {
    ensureGitRepo();
    ensureCleanWorkingTree();

    const currentVersion = getCurrentVersion();
    const newVersion = bumpVersion(type, currentVersion, digits);
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

        const action = await promptMenu([
            { digits: 3, levels: getScheme(3) },
            { digits: 5, levels: getScheme(5) },
        ]);

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

        await doBump(action.type, action.digits, { skipConfirm: false });
        await pressEnter();
    }
}

// ─── CLI definition ──────────────────────────────────────────────────

const { version: CLI_VERSION } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const program = new Command();

program
    .name('tag')
    .description('A cross-platform CLI for managing semantic versioning tags in Git repositories.')
    .version(CLI_VERSION, '-v, --version', 'Display the CLI version')
    .argument('[prefix]', 'Optional project prefix for --major/--minor/--patch');

// 3-digit bumps are flags: tag --major | --minor | --patch [prefix]
for (const level of getScheme(3)) {
    program.option(`--${level.type}`, `Bump ${level.type} version (${level.pattern}) — 3-digit`);
}

// 5-digit bumps are subcommands: tag product | major | minor | maintenance | hotfix [prefix]
for (const level of getScheme(5)) {
    program
        .command(`${level.type} [prefix]`)
        .description(`Bump ${level.type} version (${level.pattern}) — 5-digit`)
        .action((prefix) => doBump(level.type, 5, { prefix, skipConfirm: true }));
}

program
    .command('history')
    .description('View recent version history')
    .action(() => doHistory());

// No subcommand: run a 3-digit bump if a flag was given, otherwise interactive mode
program.action((prefix, options) => {
    const flags = getScheme(3).filter((level) => options[level.type]);
    if (flags.length > 1) {
        error('Use only one of --major, --minor or --patch.');
        process.exit(1);
    }
    if (flags.length === 1) return doBump(flags[0].type, 3, { prefix, skipConfirm: true });
    if (prefix) {
        error(`Unknown command "${prefix}". Run "tag --help" for usage.`);
        process.exit(1);
    }
    return interactiveMode();
});

program.parse();
