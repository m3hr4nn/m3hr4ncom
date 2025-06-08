---
title: "Jalali-Gregorian Date Converter"
date: 2025-05-31T12:00:00Z
draft: false
markup: html
---

<style>
  #converter {
    max-width: 800px;
    margin: 20px auto;
    font-family: Arial, sans-serif;
    color: var(--body-color);
  }

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 40px 10px;
  }

  td {
    vertical-align: top;
    width: 50%;
  }

  label {
    font-weight: bold;
  }

  input {
    width: 100%;
    padding: 8px;
    margin-top: 4px;
    margin-bottom: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: var(--theme);
    color: var(--body-color);
  }

  button {
    background-color: #007acc;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }

  button:hover {
    background-color: #005a99;
  }

  .result {
    margin-top: 10px;
    font-size: 16px;
    color: var(--body-color);
  }

  .error {
    color: red;
    font-weight: bold;
    margin-top: 8px;
  }
</style>

<div id="converter">
  <h2>Jalali - Gregorian Date Converter</h2>

  <table>
    <tr>
      <!-- Gregorian to Jalali -->
      <td>
        <label for="gregorianDate">Gregorian Date (YYYY/MM/DD):</label>
        <input type="text" id="gregorianDate" placeholder="e.g. 2025/06/08" />
        <button onclick="convertGregorianToJalali()">Convert to Jalali</button>
        <div id="resultG2J" class="result"></div>
        <div id="errorG2J" class="error"></div>
      </td>

      <!-- Jalali to Gregorian -->
      <td>
        <label for="jalaliDate">Jalali Date (YYYY/MM/DD):</label>
        <input type="text" id="jalaliDate" placeholder="e.g. 1404/03/18" />
        <button onclick="convertJalaliToGregorian()">Convert to Gregorian</button>
        <div id="resultJ2G" class="result"></div>
        <div id="errorJ2G" class="error"></div>
      </td>
    </tr>
  </table>
</div>

<script>
  function div(a, b) {
    return Math.floor(a / b);
  }

  function isValidDateFormat(input) {
    return /^\d{4}\/\d{2}\/\d{2}$/.test(input);
  }

  function jalaliToGregorian(jy, jm, jd) {
    jy += 1595;
    let days = -355668 + (365 * jy) + div(jy, 33) * 8 + div((jy % 33) + 3, 4) + jd;

    if (jm < 7) {
      days += (jm - 1) * 31;
    } else {
      days += ((jm - 7) * 30) + 186;
    }

    let gy = 400 * div(days, 146097);
    days %= 146097;

    if (days > 36524) {
      gy += 100 * div(--days, 36524);
      days %= 36524;
      if (days >= 365) days++;
    }

    gy += 4 * div(days, 1461);
    days %= 1461;

    if (days > 365) {
      gy += div(days - 1, 365);
      days = (days - 1) % 365;
    }

    let gd = days + 1;
    let sal_a = [0,31, (gy%4 === 0 && gy%100 !== 0) || (gy%400 === 0) ? 29 : 28, 31,30,31,30,31,31,30,31,30,31];
    let gm;

    for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) {
      gd -= sal_a[gm];
    }

    return { gy, gm, gd };
  }

  function gregorianToJalali(gy, gm, gd) {
    let g_d_m = [0,31, (gy%4 === 0 && gy%100 !== 0) || (gy%400 === 0) ? 29 : 28, 31,30,31,30,31,31,30,31,30,31];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;

    gm = gm - 1;  // Convert to 0-based index for calculation

    let days = (365 * gy) + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);
    for (let i = 0; i < gm; ++i) {
      days += g_d_m[i + 1];  // Skip g_d_m[0]
    }
    days += gd - 1;

    let j_np = Math.floor(days / 12053);
    days %= 12053;

    jy += 33 * j_np + 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days >= 366) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }

    let jm, jd;
    let j_days_in_month = [31,31,31,31,31,31,30,30,30,30,30,29];

    for (jm = 0; jm < 12 && days >= j_days_in_month[jm]; jm++) {
      days -= j_days_in_month[jm];
    }

    jd = days + 1;
    return { jy, jm: jm + 1, jd };
  }

  function convertJalaliToGregorian() {
    const input = document.getElementById('jalaliDate').value.trim().replace(/-/g, '/');
    const resultDiv = document.getElementById('resultJ2G');
    const errorDiv = document.getElementById('errorJ2G');
    resultDiv.innerHTML = '';
    errorDiv.innerHTML = '';

    if (!isValidDateFormat(input)) {
      errorDiv.innerHTML = 'Invalid format. Use YYYY/MM/DD.';
      return;
    }

    const [jy, jm, jd] = input.split('/').map(Number);
    if (jm < 1 || jm > 12 || jd < 1 || jd > 31) {
      errorDiv.innerHTML = 'Invalid date values.';
      return;
    }

    const g = jalaliToGregorian(jy, jm, jd);
    resultDiv.innerHTML = `<strong>Gregorian Date:</strong> ${g.gy}/${String(g.gm).padStart(2, '0')}/${String(g.gd).padStart(2, '0')}`;
  }

  function convertGregorianToJalali() {
    const input = document.getElementById('gregorianDate').value.trim().replace(/-/g, '/');
    const resultDiv = document.getElementById('resultG2J');
    const errorDiv = document.getElementById('errorG2J');
    resultDiv.innerHTML = '';
    errorDiv.innerHTML = '';

    if (!isValidDateFormat(input)) {
      errorDiv.innerHTML = 'Invalid format. Use YYYY/MM/DD.';
      return;
    }

    const [gy, gm, gd] = input.split('/').map(Number);
    if (gm < 1 || gm > 12 || gd < 1 || gd > 31) {
      errorDiv.innerHTML = 'Invalid date values.';
      return;
    }

    const j = gregorianToJalali(gy, gm, gd);
    resultDiv.innerHTML = `<strong>Jalali Date:</strong> ${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('jalaliDate').addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        convertJalaliToGregorian();
      }
    });

    document.getElementById('gregorianDate').addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        convertGregorianToJalali();
      }
    });
  });
</script>
