const { getCountries, getCountryCallingCode } = require('libphonenumber-js');
const fs = require('fs');

// Get the two-letter ISO codes for all supported countries
const countryCodes = getCountries();

// Create an instance of Intl.DisplayNames to get country names in English
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

console.log('Generating countries data...');

// Map the country codes to a JSON object
const countriesData = countryCodes.map(code => {
    // Some regions in the libphonenumber data are not countries (e.g., "001" for "World").
    // We can filter those out by checking if Intl.DisplayNames can resolve a country name.
    const name = regionNames.of(code);
    if (!name || name === code) return null;

    try {
        const callingCode = getCountryCallingCode(code);
        return {
            name: name,
            code: code,
            calling_code: `+${callingCode}`
        };
    } catch (e) {
        // Some codes might not have a calling code in libphonenumber-js,
        // so we catch the error and return null.
        console.warn(`Warning: No calling code found for ${code} (${name})`);
        return null;
    }
}).filter(Boolean) // Filter out any null entries
  .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by country name

// Create a final JSON string
const jsonOutput = JSON.stringify(countriesData, null, 2);

// Write the JSON to a file
fs.writeFileSync('src/data/countries.json', jsonOutput);

console.log(`✅ JSON file successfully created: src/data/countries.json`);
console.log(`📊 Total countries: ${countriesData.length}`);

// Preview first few countries
console.log('\n📋 Preview of generated data:');
countriesData.slice(0, 5).forEach(country => {
    console.log(`  ${country.name} (${country.code}): ${country.calling_code}`);
});
console.log('  ...');