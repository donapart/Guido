// Einfaches Testskript für Guido-Extension

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔍 Guido Model Router Test-Diagnose 🔍');
console.log('=====================================\n');

// 1. Umgebungsvariablen überprüfen
console.log('🔑 API Key-Überprüfung:');
const apiKeys = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY', 
  'HUGGINGFACE_API_KEY',
  'OPENROUTER_API_KEY',
  'COHERE_API_KEY'
];

apiKeys.forEach(key => {
  const masked = process.env[key] ? 
    `${process.env[key].substring(0, 4)}...${process.env[key].substring(process.env[key].length - 4)}` : 
    'nicht gesetzt';
  console.log(`${key}: ${masked}`);
});

// 2. .env-Datei überprüfen
console.log('\n📁 .env-Datei:');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env-Datei gefunden');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    const activeKeys = lines
      .filter(line => !line.trim().startsWith('#') && line.includes('='))
      .map(line => line.split('=')[0]);
    
    console.log(`Aktive Schlüssel in .env: ${activeKeys.join(', ')}`);
  } catch (err) {
    console.log(`❌ Fehler beim Lesen der .env-Datei: ${err.message}`);
  }
} else {
  console.log('❌ Keine .env-Datei gefunden');
}

// 3. router.config.yaml überprüfen
console.log('\n📁 router.config.yaml:');
const configPath = path.join(__dirname, 'router.config.yaml');
if (fs.existsSync(configPath)) {
  console.log('✅ router.config.yaml gefunden');
  
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    console.log('Konfiguration enthält:');
    console.log(`- ${configContent.split('\n').length} Zeilen`);
    console.log(`- Provider: ${configContent.includes('providers:') ? 'Ja' : 'Nein'}`);
    console.log(`- Routing: ${configContent.includes('routing:') ? 'Ja' : 'Nein'}`);
    console.log(`- API Key Refs: ${configContent.includes('apiKeyRef') ? 'Ja' : 'Nein'}`);
  } catch (err) {
    console.log(`❌ Fehler beim Lesen der router.config.yaml: ${err.message}`);
  }
} else {
  console.log('❌ Keine router.config.yaml gefunden');
}

// 4. System-Informationen
console.log('\n💻 System-Informationen:');
console.log(`- Betriebssystem: ${os.platform()} ${os.release()}`);
console.log(`- Node.js: ${process.version}`);
console.log(`- Speicherort: ${__dirname}`);

console.log('\n✅ Test-Diagnose abgeschlossen');
