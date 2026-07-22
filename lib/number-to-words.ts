export function numberToWordsFR(num: number): string {
  if (num === 0) return 'zéro';
  if (num < 0) return 'moins ' + numberToWordsFR(Math.abs(num));

  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

  function convertTens(n: number): string {
    if (n < 20) return units[n];
    if (n === 71) return 'soixante-et-onze';
    if (n === 81) return 'quatre-vingt-un';
    if (n === 91) return 'quatre-vingt-onze';
    if (n >= 70 && n < 80) return 'soixante-' + units[n - 60];
    if (n >= 90 && n < 100) return 'quatre-vingt-' + units[n - 80];
    
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    if (unit === 0) return tens[ten] + (ten === 8 ? 's' : '');
    if (unit === 1) return tens[ten] + '-et-un';
    return tens[ten] + '-' + units[unit];
  }

  function convertHundreds(n: number): string {
    if (n > 99) {
      const hundred = Math.floor(n / 100);
      const rest = n % 100;
      let res = '';
      if (hundred === 1) res = 'cent';
      else res = units[hundred] + ' cent' + (rest === 0 ? 's' : '');
      if (rest > 0) res += ' ' + convertTens(rest);
      return res;
    }
    return convertTens(n);
  }

  function convertThousands(n: number): string {
    if (n >= 1000) {
      const thousand = Math.floor(n / 1000);
      const rest = n % 1000;
      let res = '';
      if (thousand === 1) res = 'mille';
      else res = convertHundreds(thousand) + ' mille';
      if (rest > 0) res += ' ' + convertHundreds(rest);
      return res;
    }
    return convertHundreds(n);
  }

  function convertMillions(n: number): string {
    if (n >= 1000000) {
      const million = Math.floor(n / 1000000);
      const rest = n % 1000000;
      let res = convertThousands(million) + ' million' + (million > 1 ? 's' : '');
      if (rest > 0) res += ' ' + convertThousands(rest);
      return res;
    }
    return convertThousands(n);
  }

  const intPart = Math.floor(num);
  const fracPart = Math.round((num - intPart) * 100); // Only handle 2 decimals max for currency

  let result = convertMillions(intPart);
  
  if (fracPart > 0) {
    result += ' virgule ' + convertHundreds(fracPart);
  }

  return result;
}
