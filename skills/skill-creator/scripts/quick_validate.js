/**
 * Quick validation script for skills - minimal version (Node.js)
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

async function validateSkill(skillPath) {
    skillPath = path.resolve(skillPath);

    // Check SKILL.md exists
    const skillMdPath = path.join(skillPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) {
        return { valid: false, message: "SKILL.md not found" };
    }

    // Read and validate frontmatter
    let content;
    try {
        content = await readFile(skillMdPath, 'utf8');
    } catch (e) {
        return { valid: false, message: `Could not read SKILL.md: ${e.message}` };
    }

    if (!content.startsWith('---')) {
        return { valid: false, message: "No YAML frontmatter found" };
    }

    // Extract frontmatter block
    // Matches --- followed by content, followed by ---
    // Minimal regex, might need adjustment for robustness
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
        return { valid: false, message: "Invalid frontmatter format" };
    }

    const frontmatterText = match[1];

    // Simple YAML parsing (Key: Value)
    // NOTE: This is a very basic parser and won't handle complex YAML features like nested objects or arrays correctly if they span lines without strict indentation.
    // However, the skill spec is flat (name, description, etc).
    const frontmatter = {};
    const lines = frontmatterText.split('\n');

    for (const line of lines) {
        if (!line.trim() || line.trim().startsWith('#')) continue;

        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            // Rejoin the rest in case value has colons
            let value = parts.slice(1).join(':').trim();

            // Handle quoted strings
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            frontmatter[key] = value;
        }
    }

    // Define allowed properties
    const ALLOWED_PROPERTIES = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);

    // Check for unexpected properties
    const keys = Object.keys(frontmatter);
    const unexpectedKeys = keys.filter(k => !ALLOWED_PROPERTIES.has(k));

    if (unexpectedKeys.length > 0) {
        return {
            valid: false,
            message: `Unexpected key(s) in SKILL.md frontmatter: ${unexpectedKeys.sort().join(', ')}. Allowed properties are: ${Array.from(ALLOWED_PROPERTIES).sort().join(', ')}`
        };
    }

    // Check required fields
    if (!frontmatter['name']) {
        return { valid: false, message: "Missing 'name' in frontmatter" };
    }
    if (!frontmatter['description']) {
        return { valid: false, message: "Missing 'description' in frontmatter" };
    }

    // Validate Name
    const name = frontmatter['name'];
    if (!/^[a-z0-9-]+$/.test(name)) {
        return { valid: false, message: `Name '${name}' should be hyphen-case (lowercase letters, digits, and hyphens only)` };
    }
    if (name.startsWith('-') || name.endsWith('-') || name.includes('--')) {
        return { valid: false, message: `Name '${name}' cannot start/end with hyphen or contain consecutive hyphens` };
    }
    if (name.length > 64) {
        return { valid: false, message: `Name is too long (${name.length} characters). Maximum is 64 characters.` };
    }

    // Validate Description
    const description = frontmatter['description'];
    if (description.includes('<') || description.includes('>')) {
        return { valid: false, message: "Description cannot contain angle brackets (< or >)" };
    }
    if (description.length > 1024) {
        return { valid: false, message: `Description is too long (${description.length} characters). Maximum is 1024 characters.` };
    }

    return { valid: true, message: "Skill is valid!" };
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.log("Usage: node quick_validate.js <skill_directory>");
        process.exit(1);
    }

    const { valid, message } = await validateSkill(args[0]);
    console.log(message);
    process.exit(valid ? 0 : 1);
}

if (require.main === module) {
    main();
}

module.exports = { validateSkill };
