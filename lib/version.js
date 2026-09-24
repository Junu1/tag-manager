import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { error } from './ui.js';

/**
 * Read and parse a JSON file from the current working directory.
 * @param {string} filename
 * @returns {object|null}
 */
function readJsonFile(filename) {
    const filePath = join(process.cwd(), filename);
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, 'utf8'));
}

/**
 * Write an object as formatted JSON to a file in the current working directory.
 * @param {string} filename
 * @param {object} data
 */
function writeJsonFile(filename, data) {
    const filePath = join(process.cwd(), filename);
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/**
 * Get the current version string from package.json.
 * @returns {string} e.g. "1.0.0" or "1.0.0.0.0"
 */
export function getCurrentVersion() {
    const pkg = readJsonFile('package.json');
    if (!pkg) {
        error('package.json not found in current directory.');
        process.exit(1);
    }
    return pkg.version;
}

/**
 * Supported versioning schemes, keyed by number of digits.
 * Bump levels are listed from most to least significant digit.
 */
const SCHEMES = {
    3: [
        { type: 'major', label: 'Major', description: 'Breaking changes' },
        { type: 'minor', label: 'Minor', description: 'New features' },
        { type: 'patch', label: 'Patch', description: 'Bug fixes' },
    ],
    5: [
        { type: 'product', label: 'Product', description: 'New product line' },
        { type: 'major', label: 'Major', description: 'Breaking changes' },
        { type: 'minor', label: 'Minor', description: 'New features' },
        { type: 'maintenance', label: 'Maintenance', description: 'Bug fixes' },
        { type: 'hotfix', label: 'Hotfix', description: 'Quick fixes' },
    ],
};

/**
 * Parse a version string into its numeric digits (3 to 5 digits).
 * @param {string} version
 * @returns {number[]}
 */
export function parseVersion(version) {
    const parts = String(version).split('.');
    if (parts.length < 3 || parts.length > 5 || !parts.every((p) => /^\d+$/.test(p))) {
        error(
            `Unsupported version "${version}". Use Major.Minor.Patch (e.g. 1.0.0) ` +
            `or Product.Major.Minor.Maintenance.Hotfix (e.g. 1.0.0.0.0).`
        );
        process.exit(1);
    }
    return parts.map(Number);
}

/**
 * Get the bump levels for a scheme.
 * Each level includes a pattern showing which digit it changes, e.g. "x.X.0.0.0".
 * @param {3|5} digits
 * @returns {{ type: string, label: string, description: string, pattern: string }[]}
 */
export function getScheme(digits) {
    const levels = SCHEMES[digits];
    return levels.map((level, index) => ({
        ...level,
        pattern: levels.map((_, i) => (i < index ? 'x' : i === index ? 'X' : '0')).join('.'),
    }));
}

/**
 * Calculate the next version string for a given bump type and scheme.
 * The current version is first fitted to the scheme's digit count:
 * extra digits are dropped (1.2.3.4.5 → 1.2.3), missing ones are 0 (1.2.3 → 1.2.3.0.0).
 * When a digit is bumped, every digit after it resets to 0 (Git Flow SOP).
 * @param {'product'|'major'|'minor'|'patch'|'maintenance'|'hotfix'} type
 * @param {string} currentVersion
 * @param {3|5} digits  3 for Major.Minor.Patch, 5 for Product.Major.Minor.Maintenance.Hotfix
 * @returns {string}
 */
export function bumpVersion(type, currentVersion, digits) {
    const current = parseVersion(currentVersion);
    const levels = SCHEMES[digits];
    const index = levels.findIndex((level) => level.type === type);

    if (index === -1) {
        error(`Unknown ${digits}-digit bump type: ${type}`);
        process.exit(1);
    }

    return levels
        .map((_, i) => (i < index ? current[i] || 0 : i === index ? (current[i] || 0) + 1 : 0))
        .join('.');
}

/**
 * Build the full tag name with an optional project prefix.
 * @param {string} version
 * @param {string} [prefix]
 * @returns {string} e.g. "v1.0.0.0.0" or "xp-v1.0.0.0.0"
 */
export function buildTagName(version, prefix) {
    return prefix ? `${prefix}-v${version}` : `v${version}`;
}

/**
 * Update the version field in package.json and package-lock.json (if present).
 * @param {string} newVersion
 */
export function updatePackageFiles(newVersion) {
    // Update package.json
    const pkg = readJsonFile('package.json');
    if (!pkg) {
        error('package.json not found.');
        process.exit(1);
    }
    pkg.version = newVersion;
    writeJsonFile('package.json', pkg);

    // Update package-lock.json if it exists
    const pkgLock = readJsonFile('package-lock.json');
    if (pkgLock) {
        pkgLock.version = newVersion;
        if (pkgLock.packages && pkgLock.packages['']) {
            pkgLock.packages[''].version = newVersion;
        }
        writeJsonFile('package-lock.json', pkgLock);
    }
}
