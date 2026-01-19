#!/usr/bin/env node
/**
 * Skill Packager - Creates a distributable .skill file of a skill folder (Node.js version)
 *
 * Usage:
 *     node package_skill.js <path/to/skill-folder> [output-directory]
 *
 * Example:
 *     node package_skill.js .agent/skills/my-skill
 *     node package_skill.js .agent/skills/my-skill ./dist
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const { validateSkill } = require('./quick_validate');

const execAsync = promisify(exec);
const mkdir = promisify(fs.mkdir);

async function packageSkill(skillPath, outputDir = null) {
    skillPath = path.resolve(skillPath);

    // Validate skill folder exists
    if (!fs.existsSync(skillPath)) {
        console.error(`❌ Error: Skill folder not found: ${skillPath}`);
        return null;
    }

    if (!fs.statSync(skillPath).isDirectory()) {
        console.error(`❌ Error: Path is not a directory: ${skillPath}`);
        return null;
    }

    // Validate SKILL.md exists
    const skillMd = path.join(skillPath, "SKILL.md");
    if (!fs.existsSync(skillMd)) {
        console.error(`❌ Error: SKILL.md not found in ${skillPath}`);
        return null;
    }

    // Run validation before packaging
    console.log("🔍 Validating skill...");
    const { valid, message } = await validateSkill(skillPath);
    if (!valid) {
        console.error(`❌ Validation failed: ${message}`);
        console.error("   Please fix the validation errors before packaging.");
        return null;
    }
    console.log(`✅ ${message}\n`);

    // Determine output location
    const skillName = path.basename(skillPath);
    let outputPath;
    if (outputDir) {
        outputPath = path.resolve(outputDir);
        await mkdir(outputPath, { recursive: true });
    } else {
        outputPath = process.cwd();
    }

    const skillFilename = path.join(outputPath, `${skillName}.skill`);

    // Create the .skill file (zip format)
    try {
        // Use system zip command
        // -r: recursive
        // -j: junk paths (do not use directory names) - WAIT, python version preserves relative paths inside the folder?
        // Let's check python version:
        // arcname = file_path.relative_to(skill_path.parent)
        // This means if skill is at /a/b/skill, and file is /a/b/skill/c.txt
        // arcname is skill/c.txt.
        // So the zip contains the top-level folder "skill".

        // To emulate this with zip command:
        // cd into parent of skillPath, and zip the folder name.

        const parentDir = path.dirname(skillPath);
        const targetName = path.basename(skillPath);

        // Quote paths for safety
        const cmd = `cd "${parentDir}" && zip -r "${skillFilename}" "${targetName}"`;

        console.log(`Executing: ${cmd}`);
        await execAsync(cmd);

        console.log(`\n✅ Successfully packaged skill to: ${skillFilename}`);
        return skillFilename;

    } catch (e) {
        console.error(`❌ Error creating .skill file: ${e.message}`);
        return null;
    }
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log("Usage: node package_skill.js <path/to/skill-folder> [output-directory]");
        console.log("\nExample:");
        console.log("  node package_skill.js .agent/skills/my-skill");
        console.log("  node package_skill.js .agent/skills/my-skill ./dist");
        process.exit(1);
    }

    const skillPath = args[0];
    const outputDir = args[1] || null;

    console.log(`📦 Packaging skill: ${skillPath}`);
    if (outputDir) {
        console.log(`   Output directory: ${outputDir}`);
    }
    console.log();

    const result = await packageSkill(skillPath, outputDir);

    if (result) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
