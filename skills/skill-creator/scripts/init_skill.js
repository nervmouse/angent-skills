#!/usr/bin/env node
/**
 * Skill Initializer - Creates a new skill from template (Node.js version)
 *
 * Usage:
 *     node init_skill.js <skill-name> --path <path>
 *
 * Examples:
 *     node init_skill.js my-new-skill --path .agent/skills
 *     node init_skill.js my-api-helper --path .agent/skills
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const chmod = promisify(fs.chmod);
const exists = promisify(fs.exists);

const SKILL_TEMPLATE = `---
name: {skill_name}
description: "TODO: Complete and informative explanation of what the skill does and when to use it. Include WHEN to use this skill - specific scenarios, file types, or tasks that trigger it."
---

# {skill_title}

## Overview

[TODO: 1-2 sentences explaining what this skill enables]

## Structuring This Skill

[TODO: Choose the structure that best fits this skill's purpose. Common patterns:

**1. Workflow-Based** (best for sequential processes)
- Works well when there are clear step-by-step procedures
- Example: DOCX skill with "Workflow Decision Tree" → "Reading" → "Creating" → "Editing"
- Structure: ## Overview → ## Workflow Decision Tree → ## Step 1 → ## Step 2...

**2. Task-Based** (best for tool collections)
- Works well when the skill offers different operations/capabilities
- Example: PDF skill with "Quick Start" → "Merge PDFs" → "Split PDFs" → "Extract Text"
- Structure: ## Overview → ## Quick Start → ## Task Category 1 → ## Task Category 2...

**3. Reference/Guidelines** (best for standards or specifications)
- Works well for brand guidelines, coding standards, or requirements
- Example: Brand styling with "Brand Guidelines" → "Colors" → "Typography" → "Features"
- Structure: ## Overview → ## Guidelines → ## Specifications → ## Usage...

**4. Capabilities-Based** (best for integrated systems)
- Works well when the skill provides multiple interrelated features
- Example: Product Management with "Core Capabilities" → numbered capability list
- Structure: ## Overview → ## Core Capabilities → ### 1. Feature → ### 2. Feature...

Patterns can be mixed and matched as needed. Most skills combine patterns (e.g., start with task-based, add workflow for complex operations).

Delete this entire "Structuring This Skill" section when done - it's just guidance.]

## [TODO: Replace with the first main section based on chosen structure]

[TODO: Add content here. See examples in existing skills:
- Code samples for technical skills
- Decision trees for complex workflows
- Concrete examples with realistic user requests
- References to scripts/templates/references as needed]

## Resources

This skill includes example resource directories that demonstrate how to organize different types of bundled resources:

### scripts/
Executable code (Node.js/Bash/etc.) that can be run directly to perform specific operations.

**Examples from other skills:**
- PDF skill: \`fill_fillable_fields.js\`, \`extract_form_field_info.js\` - utilities for PDF manipulation
- DOCX skill: \`document.js\`, \`utilities.js\` - Node.js modules for document processing

**Appropriate for:** Node.js scripts, shell scripts, or any executable code that performs automation, data processing, or specific operations.

**Note:** Scripts may be executed without loading into context, but can still be read by the Agent for patching or environment adjustments.

### references/
Documentation and reference material intended to be loaded into context to inform the Agent's process and thinking.

**Examples from other skills:**
- Product management: \`communication.md\`, \`context_building.md\` - detailed workflow guides
- BigQuery: API reference documentation and query examples
- Finance: Schema documentation, company policies

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that the Agent should reference while working.

### assets/
Files not intended to be loaded into context, but rather used within the output the Agent produces.

**Examples from other skills:**
- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML/React boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Any unneeded directories can be deleted.** Not every skill requires all three types of resources.
`;

const EXAMPLE_SCRIPT = `#!/usr/bin/env node
/**
 * Example helper script for {skill_name}
 *
 * This is a placeholder script that can be executed directly.
 * Replace with actual implementation or delete if not needed.
 *
 * Example real scripts from other skills:
 * - pdf/scripts/fill_fillable_fields.js - Fills PDF form fields
 * - pdf/scripts/convert_pdf_to_images.js - Converts PDF pages to images
 */

function main() {
    console.log("This is an example script for {skill_name}");
    // TODO: Add actual script logic here
    // This could be data processing, file conversion, API calls, etc.
}

if (require.main === module) {
    main();
}
`;

const EXAMPLE_REFERENCE = `# Reference Documentation for {skill_title}

This is a placeholder for detailed reference documentation.
Replace with actual reference content or delete if not needed.

Example real reference docs from other skills:
- product-management/references/communication.md - Comprehensive guide for status updates
- product-management/references/context_building.md - Deep-dive on gathering context
- bigquery/references/ - API references and query examples

## When Reference Docs Are Useful

Reference docs are ideal for:
- Comprehensive API documentation
- Detailed workflow guides
- Complex multi-step processes
- Information too lengthy for main SKILL.md
- Content that's only needed for specific use cases

## Structure Suggestions

### API Reference Example
- Overview
- Authentication
- Endpoints with examples
- Error codes
- Rate limits

### Workflow Guide Example
- Prerequisites
- Step-by-step instructions
- Common patterns
- Troubleshooting
- Best practices
`;

const EXAMPLE_ASSET = `# Example Asset File

This placeholder represents where asset files would be stored.
Replace with actual asset files (templates, images, fonts, etc.) or delete if not needed.

Asset files are NOT intended to be loaded into context, but rather used within
the output the Agent produces.

Example asset files from other skills:
- Brand guidelines: logo.png, slides_template.pptx
- Frontend builder: hello-world/ directory with HTML/React boilerplate
- Typography: custom-font.ttf, font-family.woff2
- Data: sample_data.csv, test_dataset.json

## Common Asset Types

- Templates: .pptx, .docx, boilerplate directories
- Images: .png, .jpg, .svg, .gif
- Fonts: .ttf, .otf, .woff, .woff2
- Boilerplate code: Project directories, starter files
- Icons: .ico, .svg
- Data files: .csv, .json, .xml, .yaml

Note: This is a text placeholder. Actual assets can be any file type.
`;

function titleCaseSkillName(skillName) {
    return skillName.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

async function initSkill(skillName, outputPath) {
    // Determine skill directory path
    const skillDir = path.resolve(outputPath, skillName);

    // Check if directory already exists
    if (fs.existsSync(skillDir)) {
        console.error(`❌ Error: Skill directory already exists: ${skillDir}`);
        return null;
    }

    try {
        // Create skill directory
        await mkdir(skillDir, { recursive: true });
        console.log(`✅ Created skill directory: ${skillDir}`);

        // Create SKILL.md from template
        const skillTitle = titleCaseSkillName(skillName);
        const skillContent = SKILL_TEMPLATE
            .replace(/{skill_name}/g, skillName)
            .replace(/{skill_title}/g, skillTitle);

        await writeFile(path.join(skillDir, 'SKILL.md'), skillContent);
        console.log("✅ Created SKILL.md");

        // Create resource directories with example files

        // scripts/
        const scriptsDir = path.join(skillDir, 'scripts');
        await mkdir(scriptsDir);
        const exampleScriptPath = path.join(scriptsDir, 'example.js');
        const scriptContent = EXAMPLE_SCRIPT.replace(/{skill_name}/g, skillName);
        await writeFile(exampleScriptPath, scriptContent);
        await chmod(exampleScriptPath, 0o755);
        console.log("✅ Created scripts/example.js");

        // references/
        const referencesDir = path.join(skillDir, 'references');
        await mkdir(referencesDir);
        const referenceContent = EXAMPLE_REFERENCE.replace(/{skill_title}/g, skillTitle);
        await writeFile(path.join(referencesDir, 'api_reference.md'), referenceContent);
        console.log("✅ Created references/api_reference.md");

        // assets/
        const assetsDir = path.join(skillDir, 'assets');
        await mkdir(assetsDir);
        await writeFile(path.join(assetsDir, 'example_asset.txt'), EXAMPLE_ASSET);
        console.log("✅ Created assets/example_asset.txt");

        console.log(`\n✅ Skill '${skillName}' initialized successfully at ${skillDir}`);
        console.log("\nNext steps:");
        console.log("1. Edit SKILL.md to complete the TODO items and update the description");
        console.log("2. Customize or delete the example files in scripts/, references/, and assets/");
        console.log("3. Run the validator when ready to check the skill structure");

        return skillDir;
    } catch (error) {
        console.error(`❌ Error initializing skill: ${error.message}`);
        return null;
    }
}

async function main() {
    const args = process.argv.slice(2);

    // Basic argument parsing
    let skillName = null;
    let outputPath = null;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--path') {
            if (i + 1 < args.length) {
                outputPath = args[i + 1];
                i++; // Skip next arg
            }
        } else if (!skillName) {
            skillName = args[i];
        }
    }

    if (!skillName || !outputPath) {
        console.log("Usage: node init_skill.js <skill-name> --path <path>");
        console.log("\nSkill name requirements:");
        console.log("  - Hyphen-case identifier (e.g., 'data-analyzer')");
        console.log("  - Lowercase letters, digits, and hyphens only");
        console.log("  - Max 40 characters");
        console.log("  - Must match directory name exactly");
        console.log("\nExamples:");
        console.log("  node init_skill.js my-new-skill --path .agent/skills");
        console.log("  node init_skill.js my-api-helper --path .agent/skills");
        process.exit(1);
    }

    console.log(`🚀 Initializing skill: ${skillName}`);
    console.log(`   Location: ${outputPath}\n`);

    const result = await initSkill(skillName, outputPath);

    if (result) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
