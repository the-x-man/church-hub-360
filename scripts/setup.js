#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function updatePackageJson(projectName) {
  const packageJsonPath = join(__dirname, '../package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.name = projectName.toLowerCase().replaceAll(/\s+/g, '-');
  
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json');
}

function updateIndexHtml(projectName, description) {
  const indexHtmlPath = join(__dirname, '../index.html');
  let indexHtml = readFileSync(indexHtmlPath, 'utf8');
  
  // Update title
  indexHtml = indexHtml.replace(
    /<title>.*<\/title>/,
    `<title>${projectName}</title>`
  );
  
  // Add description meta tag after viewport
  if (!indexHtml.includes('<meta name="description"')) {
    indexHtml = indexHtml.replace(
      /<meta name="viewport"[^>]*>/,
      `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <meta name="description" content="${description}" />`
    );
  }
  
  writeFileSync(indexHtmlPath, indexHtml);
  console.log('✅ Updated index.html');
}

async function main() {
  console.log('🚀 FMT Template Setup');
  console.log('=====================\n');
  
  try {
    const projectName = await question('Enter project name: ');
    if (!projectName.trim()) {
      console.log('❌ Project name cannot be empty');
      process.exit(1);
    }
    
    const description = await question('Enter project description: ');
    if (!description.trim()) {
      console.log('❌ Project description cannot be empty');
      process.exit(1);
    }
    
    console.log('\n📝 Updating project files...');
    
    updatePackageJson(projectName.trim());
    updateIndexHtml(projectName.trim(), description.trim());
    
    console.log('\n🎉 Project setup completed successfully!');
    console.log(`Project Name: ${projectName.trim()}`);
    console.log(`Description: ${description.trim()}`);
    console.log('\n💡 You can now delete this setup.js file if you want.');
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();