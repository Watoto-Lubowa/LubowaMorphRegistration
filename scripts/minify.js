const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting minification process...');

// Check if minification tools are installed
try {
  execSync('npx terser --version', { stdio: 'ignore' });
  execSync('npx cleancss --version', { stdio: 'ignore' });
  execSync('npx html-minifier-terser --version', { stdio: 'ignore' });
} catch (error) {
  console.log('⚠️ Installing minification tools...');
  execSync('npm install', { stdio: 'inherit' });
}

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// JavaScript minification with obfuscation
console.log('📦 Minifying JavaScript files...');
const jsFiles = ['src/scripts/scripts.js', 'src/scripts/admin.js', 'config/config.js'];

jsFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const outputFile = file.replace('.js', '.min.js');
    const distOutputFile = path.join(distDir, outputFile);
    
    try {
      execSync(`npx terser ${file} --compress drop_console=true,drop_debugger=true --mangle toplevel,reserved=[] --output ${distOutputFile}`, { stdio: 'inherit' });
      console.log(`✅ Minified ${file} -> ${distOutputFile}`);
    } catch (error) {
      console.error(`❌ Failed to minify ${file}:`, error.message);
    }
  }
});

// CSS minification
console.log('🎨 Minifying CSS files...');
const cssFiles = ['src/styles/styles.css', 'src/styles/admin-styles.css'];

cssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const outputFile = file.replace('.css', '.min.css');
    const distOutputFile = path.join(distDir, outputFile);
    
    try {
      execSync(`npx cleancss ${file} --output ${distOutputFile}`, { stdio: 'inherit' });
      console.log(`✅ Minified ${file} -> ${distOutputFile}`);
    } catch (error) {
      console.error(`❌ Failed to minify ${file}:`, error.message);
    }
  }
});

// HTML minification
console.log('📄 Minifying HTML files...');
const htmlFiles = ['index.html', 'main.html', 'admin.html'];

htmlFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const distOutputFile = path.join(distDir, file);
    
    try {
      // Read the original HTML file
      let htmlContent = fs.readFileSync(file, 'utf8');
      
      // Replace script and CSS references with minified versions
      htmlContent = htmlContent.replace(/src\/scripts\/scripts\.js/g, 'scripts.min.js');
      htmlContent = htmlContent.replace(/src\/scripts\/admin\.js/g, 'admin.min.js');
      htmlContent = htmlContent.replace(/config\/config\.js/g, 'config.min.js');
      htmlContent = htmlContent.replace(/src\/styles\/styles\.css/g, 'styles.min.css');
      htmlContent = htmlContent.replace(/src\/styles\/admin-styles\.css/g, 'admin-styles.min.css');
      
      // Write modified HTML to temp file
      const tempFile = file + '.temp';
      fs.writeFileSync(tempFile, htmlContent);
      
      // Minify the HTML
      execSync(`npx html-minifier-terser ${tempFile} --output ${distOutputFile} --remove-comments --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-tag-whitespace --use-short-doctype --collapse-whitespace --minify-css true --minify-js true --process-conditional-comments --sort-attributes --sort-class-name`, { stdio: 'inherit' });
      
      // Remove temp file
      fs.unlinkSync(tempFile);
      
      console.log(`✅ Minified ${file} -> ${distOutputFile}`);
    } catch (error) {
      console.error(`❌ Failed to minify ${file}:`, error.message);
    }
  }
});

// Copy other necessary files
console.log('📁 Copying other files...');
const otherFiles = ['config/firestore.rules', 'config/firestore.indexes.json', 'README.md', '.gitignore'];

otherFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const distOutputFile = path.join(distDir, file);
    try {
      fs.copyFileSync(file, distOutputFile);
      console.log(`✅ Copied ${file} -> ${distOutputFile}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${file}:`, error.message);
    }
  }
});

// Calculate size reduction
console.log('📊 Calculating size reduction...');

let originalSize = 0;
let minifiedSize = 0;

// Calculate original sizes
jsFiles.concat(cssFiles).concat(htmlFiles).forEach(file => {
  if (fs.existsSync(file)) {
    originalSize += fs.statSync(file).size;
  }
});

// Calculate minified sizes
fs.readdirSync(distDir).forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.statSync(filePath).isFile()) {
    minifiedSize += fs.statSync(filePath).size;
  }
});

const reductionPercent = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
const originalSizeKB = (originalSize / 1024).toFixed(1);
const minifiedSizeKB = (minifiedSize / 1024).toFixed(1);

console.log('🎉 Minification completed!');
console.log(`📏 Original size: ${originalSizeKB} KB`);
console.log(`📦 Minified size: ${minifiedSizeKB} KB`);
console.log(`💾 Size reduction: ${reductionPercent}%`);
console.log('📂 Minified files are in the ./dist directory');
console.log('🚀 Ready for deployment!');
