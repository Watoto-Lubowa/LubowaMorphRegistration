import type { Country } from '@/types'
import countriesData from '@/assets/data/countries.json'

export function loadCountriesData(): Country[] {
  return countriesData as Country[]
}

export function getCountryByCode(code: string): Country | undefined {
  return countriesData.find((country: Country) => country.code === code)
}

export function getCountryByCallingCode(callingCode: string): Country | undefined {
  return countriesData.find((country: Country) => country.calling_code === callingCode)
}

export function getCallingCodeByCountryCode(code: string): string {
  const country = getCountryByCode(code)
  return country?.calling_code || '+256'
}

export function getCountryCodeByCallingCode(callingCode: string): string {
  const country = getCountryByCallingCode(callingCode)
  return country?.code || 'UG'
}

export function searchCountries(searchTerm: string): Country[] {
  const term = searchTerm.toLowerCase()
  return countriesData.filter((country: Country) => 
    country.name.toLowerCase().includes(term) ||
    country.code.toLowerCase().includes(term) ||
    country.calling_code.includes(term)
  )
}
