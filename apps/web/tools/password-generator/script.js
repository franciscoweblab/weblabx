document.addEventListener("DOMContentLoaded", () => {

  const result = document.getElementById("result");
  const lengthEl = document.getElementById("length");
  const lengthValue = document.getElementById("length-value");
  const lowerEl = document.getElementById("lower");
  const upperEl = document.getElementById("upper");
  const numbersEl = document.getElementById("numbers");
  const symbolsEl = document.getElementById("symbols");
  const generateBtn = document.getElementById("generate");
  const regenBtn = document.getElementById("regen");
  const copyBtn = document.getElementById("copy");

  const strengthFill = document.getElementById("strength-fill");
  const strengthText = document.getElementById("strength-text");

  lengthValue.textContent = lengthEl.value;

  const chars = {
    lower: "abcdefghijklmnopqrstuvwxyz",
    upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}<>?"
  };

  function generatePassword() {
    let pool = "";
    if (lowerEl.checked) pool += chars.lower;
    if (upperEl.checked) pool += chars.upper;
    if (numbersEl.checked) pool += chars.numbers;
    if (symbolsEl.checked) pool += chars.symbols;

    if (!pool) {
      result.value = "";
      updateStrength(0);
      return;
    }

    let password = "";
    for (let i = 0; i < lengthEl.value; i++) {
      password += pool[Math.floor(Math.random() * pool.length)];
    }

    result.value = password;
    updateStrength(calculateStrength(password));
  }

  function calculateStrength(pwd) {
    let score = 0;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 20) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  }

  function updateStrength(score) {
    const levels = [
      { w: 15, c: "#ef4444", t: "Weak" },
      { w: 35, c: "#f97316", t: "Medium" },
      { w: 60, c: "#eab308", t: "Good" },
      { w: 85, c: "#22c55e", t: "Strong" },
      { w: 100, c: "#16a34a", t: "Very Strong" }
    ];

    const lvl = levels[Math.min(score, levels.length - 1)];
    strengthFill.style.width = lvl.w + "%";
    strengthFill.style.background = lvl.c;
    strengthText.textContent = lvl.t;
  }

  lengthEl.addEventListener("input", () => {
    lengthValue.textContent = lengthEl.value;
    if (result.value) generatePassword();
  });

  generateBtn.addEventListener("click", generatePassword);
  regenBtn.addEventListener("click", generatePassword);

  copyBtn.addEventListener("click", () => {
    if (!result.value) return;
    navigator.clipboard.writeText(result.value);
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.textContent = "Copiar", 1200);
  });

});
