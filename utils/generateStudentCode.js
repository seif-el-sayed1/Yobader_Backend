const { randomInt } = require("crypto");

const isWeak = (code) =>
  /(\d)\1{3,}/.test(code) ||                       
  "0123456789".includes(code.slice(0, 4)) ||       
  "9876543210".includes(code.slice(0, 4));        

const luhnCheckDigit = (base) => {
  let sum = 0;
  [...base].reverse().forEach((ch, i) => {
    let n = Number(ch);
    if (i % 2 === 0) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  });
  return (10 - (sum % 10)) % 10;
};

const generateStudentCode = () => {
  let base;
  do base = randomInt(100_000, 1_000_000).toString();
  while (isWeak(base));
  return base + luhnCheckDigit(base);
};

const isValidStudentCode = (code) => {
  if (!/^\d{7}$/.test(code)) return false;
  return luhnCheckDigit(code.slice(0, 6)) === Number(code[6]);
};

module.exports = { generateStudentCode, isValidStudentCode };