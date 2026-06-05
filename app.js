const STORAGE_KEY = "buywise-state-v1";
const THEME_KEY = "buywise-theme";

const purchaseConfig = {
  phone: {
    label: "phone",
    priceLabel: "Phone price",
    tenureLabel: "EMI tenure in months",
    tenureUnit: "months",
    interestLabel: "Interest rate, optional",
    extraLabel: "Monthly accessories / insurance estimate, optional",
    extraCostLabel: "accessories and insurance",
    good: 20,
    caution: 30,
    defaultTenure: 12,
    depreciationNote: "Phones lose value quickly, so avoid long EMIs unless your income buffer is strong."
  },
  bike: {
    label: "bike",
    priceLabel: "Bike price",
    tenureLabel: "Loan tenure in years",
    tenureUnit: "years",
    interestLabel: "Interest rate",
    extraLabel: "Monthly fuel and maintenance estimate",
    extraCostLabel: "fuel, servicing, insurance, helmet, repairs, and resale value",
    good: 30,
    caution: 40,
    defaultTenure: 3
  },
  car: {
    label: "car",
    priceLabel: "Car price",
    tenureLabel: "Loan tenure in years",
    tenureUnit: "years",
    interestLabel: "Interest rate",
    extraLabel: "Monthly fuel, insurance, parking, and maintenance estimate",
    extraCostLabel: "fuel, insurance, servicing, parking, tyres, repairs, and depreciation",
    good: 35,
    caution: 45,
    defaultTenure: 5
  },
  house: {
    label: "house",
    priceLabel: "House price",
    tenureLabel: "Loan tenure in years",
    tenureUnit: "years",
    interestLabel: "Interest rate",
    extraLabel: "Monthly maintenance estimate",
    setupLabel: "Stamp duty / registration / setup cost estimate",
    extraCostLabel: "stamp duty, registration, interiors, maintenance, repairs, shifting, furniture, and emergency fund",
    good: 40,
    caution: 50,
    defaultTenure: 20
  }
};

const form = document.querySelector("#affordability-form");
const themeToggle = document.querySelector("#theme-toggle");
const purchaseFields = document.querySelector("#purchase-fields");
const detailsCopy = document.querySelector("#details-copy");
const emiList = document.querySelector("#emi-list");
const addEmiButton = document.querySelector("#add-emi");
const existingEmiTotal = document.querySelector("#existing-emi-total");
const validationMessage = document.querySelector("#validation-message");
const resetButton = document.querySelector("#reset-data");
const results = document.querySelector("#results");

const metricIds = {
  income: "#metric-income",
  expenses: "#metric-expenses",
  existing: "#metric-existing",
  newEmi: "#metric-new-emi",
  emiRatio: "#metric-emi-ratio",
  obligationRatio: "#metric-obligation-ratio",
  extra: "#metric-extra",
  outflow: "#metric-outflow",
  balanceAfterEmi: "#metric-balance-after-emi",
  realSurplus: "#metric-real-surplus",
  savings: "#metric-savings",
  savingsLeft: "#metric-savings-left",
  emergencyCover: "#metric-emergency-cover",
  minEmergency: "#metric-min-emergency",
  emergencyGap: "#metric-emergency-gap",
  theoreticalEmi: "#theoretical-emi",
  safeEmiNow: "#safe-emi-now",
  safeLoan: "#safe-loan",
  safePrice: "#safe-price"
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1
});

const inputNumberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2
});

let emiCounter = 0;

function money(value) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function percent(value) {
  return `${percentFormatter.format(Number.isFinite(value) ? value : 0)}%`;
}

function emergencyCoverText(value) {
  if (!Number.isFinite(value)) return "Not available";
  if (value <= 0) return "0 months";
  return `${percentFormatter.format(value)} months`;
}

function parseFormattedNumber(value) {
  const normalized = String(value || "").replace(/,/g, "").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberForInput(value) {
  const normalized = String(value || "").replace(/,/g, "").trim();
  if (normalized === "" || normalized === ".") return normalized;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return "";
  return inputNumberFormatter.format(parsed);
}

function normalizeNumericInputs(root = document) {
  root.querySelectorAll("[data-number='currency']").forEach((input) => {
    input.value = formatNumberForInput(input.value);
  });
}

function numberValue(id) {
  const input = document.querySelector(id);
  return parseFormattedNumber(input?.value || "0");
}

function selectedPurchaseType() {
  return document.querySelector("#purchase-type").value;
}

function getTenureMonths(type) {
  const rawTenure = numberValue("#purchase-tenure");
  return purchaseConfig[type].tenureUnit === "years" ? rawTenure * 12 : rawTenure;
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  themeToggle.querySelector("span").textContent = theme === "dark" ? "☼" : "◐";
  localStorage.setItem(THEME_KEY, theme);
}

function renderPurchaseFields(type) {
  const config = purchaseConfig[type];
  detailsCopy.textContent = `Enter ${config.label} price, tenure, and ownership costs.`;
  purchaseFields.innerHTML = `
    <label class="field">
      <span>${config.priceLabel}</span>
      <input id="purchase-price" class="formatted-number" name="purchasePrice" type="text" inputmode="numeric" autocomplete="off" placeholder="5,00,000" data-number="currency">
    </label>
    <label class="field">
      <span>Down payment / upfront payment</span>
      <input id="purchase-down-payment" class="formatted-number" name="purchaseDownPayment" type="text" inputmode="numeric" autocomplete="off" placeholder="1,00,000" data-number="currency">
    </label>
    <label class="field">
      <span>${config.tenureLabel}</span>
      <input id="purchase-tenure" name="purchaseTenure" type="number" min="0" step="1" inputmode="decimal" placeholder="${config.defaultTenure}">
    </label>
    <label class="field">
      <span>${config.interestLabel}</span>
      <input id="interest-rate" name="interestRate" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0">
    </label>
    <label class="field">
      <span>${config.extraLabel}</span>
      <input id="extra-cost" class="formatted-number" name="extraCost" type="text" inputmode="numeric" autocomplete="off" placeholder="3,000" data-number="currency">
    </label>
    ${config.setupLabel ? `
      <label class="field">
        <span>${config.setupLabel}</span>
        <input id="setup-cost" class="formatted-number" name="setupCost" type="text" inputmode="numeric" autocomplete="off" placeholder="5,00,000" data-number="currency">
      </label>
    ` : ""}
  `;
  normalizeNumericInputs(purchaseFields);
}

function addEmiRow(data = {}) {
  emiCounter += 1;
  const row = document.createElement("div");
  row.className = "emi-row";
  row.dataset.emiId = String(emiCounter);
  row.innerHTML = `
    <label class="field">
      <span>EMI name</span>
      <input class="emi-name" type="text" placeholder="Personal Loan" value="${escapeAttribute(data.name || "")}">
    </label>
    <label class="field">
      <span>EMI amount</span>
      <input class="emi-amount formatted-number" type="text" inputmode="numeric" autocomplete="off" placeholder="8,000" data-number="currency" value="${data.amount || ""}">
    </label>
    <label class="field">
      <span>Frequency</span>
      <select class="emi-frequency">
        <option value="monthly" ${data.frequency !== "annual" ? "selected" : ""}>Monthly</option>
        <option value="annual" ${data.frequency === "annual" ? "selected" : ""}>Annual</option>
      </select>
    </label>
    <button class="remove-emi" type="button">Remove</button>
  `;
  emiList.append(row);
  normalizeNumericInputs(row);
  row.querySelector(".remove-emi").addEventListener("click", () => {
    row.remove();
    updateExistingEmiTotal();
    saveState();
  });
  row.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", () => {
      updateExistingEmiTotal();
      saveState();
    });
  });
}

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function getExistingEmis() {
  return [...emiList.querySelectorAll(".emi-row")].map((row) => {
    const amount = parseFormattedNumber(row.querySelector(".emi-amount").value || "0");
    const frequency = row.querySelector(".emi-frequency").value;
    return {
      name: row.querySelector(".emi-name").value.trim(),
      amount: Number.isFinite(amount) ? amount : 0,
      frequency,
      monthlyAmount: frequency === "annual" ? (Number.isFinite(amount) ? amount : 0) / 12 : (Number.isFinite(amount) ? amount : 0)
    };
  });
}

function updateExistingEmiTotal() {
  const total = getExistingEmis().reduce((sum, emi) => sum + emi.monthlyAmount, 0);
  existingEmiTotal.textContent = money(total);
  return total;
}

// Standard reducing balance EMI formula. When rate is 0, it becomes simple loan amount / tenure.
function calculateEmi(loanAmount, annualRate, tenureMonths) {
  if (loanAmount <= 0) return 0;
  if (tenureMonths <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return loanAmount / tenureMonths;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return loanAmount * monthlyRate * factor / (factor - 1);
}

function approximateLoanFromEmi(emi, annualRate, tenureMonths) {
  if (emi <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return emi * tenureMonths;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return emi * (factor - 1) / (monthlyRate * factor);
}

function validateInputs(data) {
  const allNumbers = document.querySelectorAll('input[type="number"], [data-number]');
  for (const input of allNumbers) {
    const value = parseFormattedNumber(input.value || "0");
    if (Number.isFinite(value) && value < 0) {
      return `${input.closest(".field")?.querySelector("span")?.textContent || "A value"} cannot be negative.`;
    }
  }
  if (data.monthlyIncome <= 0) return "Enter your income before checking affordability.";
  if (data.expensesEntered && data.monthlyEssentialExpenses <= 0) {
    return "Monthly essential expenses cannot be zero. Leave it blank if you want BuyWise to estimate it.";
  }
  if (data.purchasePrice <= 0) return "Enter the purchase price.";
  if (data.downPayment > data.purchasePrice) return "Down payment cannot be greater than the purchase price.";
  if (data.type === "house" && data.downPayment + data.setupCost > data.savings) {
    return "Down payment plus setup costs are greater than your available savings.";
  }
  if (data.downPayment > data.savings) return "Down payment is greater than your available savings.";
  if (data.loanAmount > 0 && data.tenureMonths <= 0) return "Enter the EMI or loan tenure.";
  return "";
}

function collectData() {
  const type = selectedPurchaseType();
  const incomeAmount = numberValue("#income-amount");
  const monthlyIncome = document.querySelector("#income-type").value === "annual" ? incomeAmount / 12 : incomeAmount;
  const expenseInput = document.querySelector("#monthly-expenses");
  const expensesEntered = expenseInput.value.trim() !== "";
  const enteredMonthlyExpenses = numberValue("#monthly-expenses");
  const monthlyEssentialExpenses = expensesEntered ? enteredMonthlyExpenses : monthlyIncome * 0.5;
  const purchasePrice = numberValue("#purchase-price");
  const downPayment = numberValue("#purchase-down-payment");
  const savings = numberValue("#savings");
  const interestRate = numberValue("#interest-rate");
  const extraCost = numberValue("#extra-cost");
  const setupCost = numberValue("#setup-cost");
  const existingMonthlyEmi = updateExistingEmiTotal();
  const tenureMonths = getTenureMonths(type);
  const loanAmount = Math.max(0, purchasePrice - downPayment);
  const newEmi = calculateEmi(loanAmount, interestRate, tenureMonths);
  const totalEmi = existingMonthlyEmi + newEmi;
  const totalOutflow = totalEmi + extraCost;
  const emiRatio = monthlyIncome > 0 ? (newEmi / monthlyIncome) * 100 : 0;
  const obligationRatio = monthlyIncome > 0 ? (totalOutflow / monthlyIncome) * 100 : 0;
  const balanceAfterEmi = monthlyIncome - totalOutflow;
  const realMonthlySurplus = monthlyIncome - monthlyEssentialExpenses - totalOutflow;
  const downPaymentPercent = purchasePrice > 0 ? (downPayment / purchasePrice) * 100 : 0;
  const setupCashOutflow = type === "house" ? setupCost : 0;
  const savingsLeft = savings - downPayment - setupCashOutflow;
  const minimumEmergencyFund = monthlyEssentialExpenses * 3;
  const comfortableEmergencyFund = monthlyEssentialExpenses * 6;
  const emergencyFundGap = Math.max(0, minimumEmergencyFund - savingsLeft);
  const emergencyMonths = monthlyEssentialExpenses > 0 ? savingsLeft / monthlyEssentialExpenses : Number.NaN;
  const purchaseIncomeRatio = monthlyIncome > 0 ? purchasePrice / monthlyIncome : 0;

  return {
    type,
    monthlyIncome,
    monthlyEssentialExpenses,
    expensesEntered,
    purchasePrice,
    downPayment,
    savings,
    interestRate,
    extraCost,
    setupCost,
    setupCashOutflow,
    existingMonthlyEmi,
    tenureMonths,
    loanAmount,
    newEmi,
    totalEmi,
    totalOutflow,
    emiRatio,
    obligationRatio,
    balanceAfterEmi,
    realMonthlySurplus,
    downPaymentPercent,
    savingsLeft,
    minimumEmergencyFund,
    comfortableEmergencyFund,
    emergencyFundGap,
    emergencyMonths,
    purchaseIncomeRatio
  };
}

function obligationBand(data) {
  const config = purchaseConfig[data.type];
  if (data.obligationRatio > config.caution) return "risky";
  if (data.obligationRatio > config.good) return "caution";
  return "safe";
}

function isPurchasePriceHigh(data) {
  if (data.type === "phone") return data.purchaseIncomeRatio > 1;
  if (data.type === "bike") return data.purchaseIncomeRatio > 3;
  return false;
}

// Risk scoring combines obligation pressure, emergency fund coverage, down payment strength, purchase size, and depreciation.
function scoreRisk(data) {
  const config = purchaseConfig[data.type];
  let score = Math.min(52, (data.obligationRatio / Math.max(config.caution, 1)) * 52);
  if (data.savingsLeft < data.monthlyEssentialExpenses) score += 32;
  else if (data.savingsLeft < data.minimumEmergencyFund) score += 22;
  else if (data.savingsLeft < data.comfortableEmergencyFund) score += 8;
  if (data.realMonthlySurplus < 0) score += 30;
  else if (data.realMonthlySurplus < data.monthlyEssentialExpenses * 0.25) score += 12;
  if (data.downPaymentPercent < 10 && data.loanAmount > 0) score += 10;
  else if (data.downPaymentPercent < 20 && data.type !== "phone" && data.loanAmount > 0) score += 6;
  if (data.purchaseIncomeRatio > 2) score += 24;
  else if (data.purchaseIncomeRatio > 1) score += 14;
  else if (data.type === "phone" && data.purchaseIncomeRatio > 0.5) score += 8;
  if (data.type === "phone") score += 8;
  if (data.type === "car") score += 6;
  if (data.type === "house" && data.savingsLeft < data.comfortableEmergencyFund) score += 8;
  return Math.max(0, Math.min(100, score));
}

function verdict(data) {
  const band = obligationBand(data);
  if (band === "risky" || data.savingsLeft < data.monthlyEssentialExpenses || data.realMonthlySurplus < 0) {
    return { title: "Not recommended right now", level: "risky", label: "Risky" };
  }
  if (band === "caution" || data.savingsLeft < data.minimumEmergencyFund) {
    return { title: "Possible, but risky", level: "caution", label: "Caution" };
  }
  if (
    data.emergencyMonths >= 3 &&
    data.emergencyMonths < 4 &&
    (data.downPaymentPercent < 10 || isPurchasePriceHigh(data) || data.existingMonthlyEmi > 0)
  ) {
    return { title: "Possible, but risky", level: "caution", label: "Caution" };
  }
  if (band === "safe" && data.savingsLeft >= data.minimumEmergencyFund) {
    return { title: "Looks manageable", level: "good", label: "Good" };
  }
  return { title: "Possible, but risky", level: "caution", label: "Caution" };
}

function alignVerdictWithRisk(verdictData, riskScore) {
  if (riskScore >= 80) {
    return { title: "Not recommended right now", level: "risky", label: "Risky" };
  }
  if (riskScore >= 65 && verdictData.level === "good") {
    return { title: "Possible, but risky", level: "caution", label: "Caution" };
  }
  return verdictData;
}

function setMetric(id, value) {
  document.querySelector(id).textContent = value;
}

function buildAdvice(data, verdictData) {
  const config = purchaseConfig[data.type];
  const dpStandard = getDownPaymentStandard(data);
  const manageable = verdictData.level === "good";
  const borderlineEmergency = data.emergencyFundGap === 0 && data.emergencyMonths >= 3 && data.emergencyMonths < 4;
  const borderlineReasons = [];
  if (data.existingMonthlyEmi > 0) borderlineReasons.push("you already have existing EMI");
  if (data.downPaymentPercent < 10) borderlineReasons.push("the down payment is low");
  if (isPurchasePriceHigh(data)) borderlineReasons.push("the purchase price is high for this category");
  const emergencyText = data.expensesEntered
    ? `After the down payment${data.setupCashOutflow > 0 ? " and setup costs" : ""}, you would have ${money(data.savingsLeft)} left against a minimum emergency fund need of ${money(data.minimumEmergencyFund)}.`
    : "Monthly expenses are estimated because you did not enter them.";
  const positiveLine = manageable
    ? `Your total monthly obligation is ${percent(data.obligationRatio)}, your real monthly surplus is ${money(data.realMonthlySurplus)}, and savings left after down payment covers at least 3 months of essential expenses.`
    : data.type === "house" && data.emergencyFundGap > 0
      ? `The house EMI alone is not the biggest issue. The problem is that setup cost and ownership cost reduce your cash buffer too much, leaving only ${money(data.savingsLeft)} against a required emergency fund of ${money(data.minimumEmergencyFund)}.`
    : borderlineEmergency && data.obligationRatio <= config.good
      ? `The EMI itself is manageable and your emergency fund meets the minimum 3-month level. The caution is because your buffer is only just enough${borderlineReasons.length ? `, ${borderlineReasons.join(", ")}` : ""}.`
      : data.obligationRatio <= config.good
        ? "The EMI itself may be manageable, but the purchase is still risky because your emergency fund is weak."
        : "Some parts of the purchase may be manageable, but EMI pressure and cash buffer need attention.";
  const downPaymentLine = data.downPaymentPercent >= 25
    ? "Your down payment is healthy, so loan pressure is lower."
    : "A larger down payment can reduce EMI pressure, but it should not drain your emergency fund.";
  const waitReasons = [];
  if (data.savingsLeft < data.minimumEmergencyFund) waitReasons.push(`savings left is below the minimum emergency fund of ${money(data.minimumEmergencyFund)}`);
  if (borderlineEmergency) waitReasons.push("your emergency fund is only at the minimum level. This is acceptable, but there is no extra cushion");
  if (data.savingsLeft < data.monthlyEssentialExpenses) waitReasons.push("savings left is below even 1 month of essential expenses");
  if (data.realMonthlySurplus < 0) waitReasons.push(`after essential expenses and this EMI, your actual monthly surplus is negative at ${money(data.realMonthlySurplus)}`);
  else if (data.realMonthlySurplus < data.monthlyEssentialExpenses * 0.25) waitReasons.push(`after essential expenses and this EMI, your actual monthly surplus is only ${money(data.realMonthlySurplus)}`);
  if (data.obligationRatio > config.good) waitReasons.push(`total obligation reaches ${percent(data.obligationRatio)}, above the safer range for a ${config.label}`);
  if (data.type === "phone" && data.purchaseIncomeRatio > 2) waitReasons.push("the phone price is more than 2 months of income");
  else if (data.type === "phone" && data.purchaseIncomeRatio > 1) waitReasons.push("the phone price is more than 1 month of income");
  if (data.type === "bike" && data.purchaseIncomeRatio > 5) waitReasons.push("the bike price is more than 5 months of income");
  else if (data.type === "bike" && data.purchaseIncomeRatio > 3) waitReasons.push("the bike price is more than 3 months of income");
  if (dpStandard.marketGap > 0 && data.type === "house") waitReasons.push("current down payment is below typical lender LTV requirement");
  else if (dpStandard.marketGap > 0 && (data.type === "bike" || data.type === "car")) waitReasons.push("current down payment is below common market minimum");
  if (dpStandard.safeGap > 0) waitReasons.push("BuyWise recommends a higher down payment to reduce EMI pressure, but only if emergency reserve remains protected");
  if (data.type === "phone" && data.downPayment <= 0) waitReasons.push("zero down payment may be available, but it pushes the full phone price into EMI");
  const waitLine = manageable
    ? "This looks manageable, but keep an eye on ownership costs, emergency fund, and future income stability."
    : data.type === "house" && data.emergencyFundGap > 0
      ? `You should wait because your emergency fund is below the minimum 3-month level. Your real monthly surplus is only ${money(data.realMonthlySurplus)}, and the total EMI plus ownership cost is ${percent(data.obligationRatio)} of your monthly income.`
    : verdictData.level === "caution" && borderlineEmergency
      ? `Your emergency fund meets the minimum 3-month level, but there is no extra cushion. ${borderlineReasons.length ? `Since ${borderlineReasons.join(" or ")}, this purchase is possible but not fully comfortable.` : "This purchase is possible, but not fully comfortable."}`
    : verdictData.level === "risky" && waitReasons.length
      ? `You should wait because ${waitReasons.join(", ")}.`
      : verdictData.level === "caution"
        ? `This purchase is possible, but treat it with caution because ${waitReasons.length ? waitReasons.join(", ") : "your buffer is not very strong"}.`
        : "You should wait until the emergency fund, EMI pressure, or monthly surplus improves.";
  const productWarning = {
    phone: "A phone is a depreciating purchase. Long EMIs can outlast the excitement of the upgrade while the phone value falls quickly.",
    bike: "For a bike, budget for fuel, servicing, insurance, helmet, tyres, repairs, and resale value.",
    car: "A car cost is not only EMI. Fuel, parking, servicing, tyres, insurance, repairs, and depreciation can become a large monthly load.",
    house: "For a house, stamp duty, registration, interiors, furniture, repairs, maintenance, society charges, shifting, and long-term EMI lock-in can stress cash flow. Setup costs reduce cash buffer immediately."
  }[data.type];
  const riskyLine = data.emergencyFundGap > 0
    ? "Your EMI may look affordable, but your emergency buffer is weak. Buying now can expose you to risk."
    : borderlineEmergency
      ? "Your emergency fund is only at the minimum level. This is acceptable, but there is no extra cushion."
    : "The main risk is underestimating ownership costs after the purchase.";
  const nextActions = [];
  if (data.type === "house" && data.emergencyFundGap > 0) {
    nextActions.push(`first rebuild your emergency fund by ${money(data.emergencyFundGap)}`);
    nextActions.push("then reduce setup cost, increase down payment only if emergency savings remain protected, or choose a lower-budget house");
  } else {
    if (data.emergencyFundGap > 0) nextActions.push(`build at least ${money(data.emergencyFundGap)} more emergency fund first`);
    if (data.obligationRatio > config.good) nextActions.push("reduce the budget or increase down payment without using emergency cash");
    if (data.downPaymentPercent < 20 && data.type !== "phone") nextActions.push("increase down payment before taking a large loan");
    if (data.type === "phone") nextActions.push("avoid a long phone EMI; choose a shorter EMI only if real monthly surplus remains safe");
    else nextActions.push("choose a shorter EMI only if your real monthly surplus remains safe");
  }

  return {
    whyBuy: `${positiveLine} ${manageable ? downPaymentLine : emergencyText}`,
    whyWait: waitLine,
    whatWrong: `${riskyLine} ${productWarning}`,
    nextStep: capitalizeSentence(nextActions.join(". ") + ".")
  };
}

function capitalizeSentence(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function titleCase(value) {
  return String(value || "").charAt(0).toUpperCase() + String(value || "").slice(1);
}

function tenureText(data) {
  const config = purchaseConfig[data.type];
  if (config.tenureUnit === "years") {
    return `${percentFormatter.format(data.tenureMonths / 12)} years`;
  }
  return `${percentFormatter.format(data.tenureMonths)} months`;
}

function getDownPaymentStandard(data) {
  const price = data.purchasePrice;
  let marketMinimumPercent = 0;
  let safeRecommendedPercent = 0;
  let marketNote = "";
  let safeNote = "";

  if (data.type === "house") {
    if (price <= 3000000) marketMinimumPercent = 10;
    else if (price <= 7500000) marketMinimumPercent = 20;
    else marketMinimumPercent = 25;
    safeRecommendedPercent = Math.max(marketMinimumPercent, 20);
    marketNote = "Based on Indian home-loan LTV limits. Setup, registration, stamp duty, interiors, and other costs are separate.";
    safeNote = "BuyWise protects emergency reserve first, then suggests down payment.";
  }

  if (data.type === "phone") {
    marketMinimumPercent = 0;
    safeRecommendedPercent = 20;
    marketNote = "Zero-down-payment EMI may be available depending on lender, card, merchant, and product.";
    safeNote = "Zero down payment does not mean affordable. Phones depreciate fast.";
  }

  if (data.type === "bike") {
    marketMinimumPercent = 5;
    safeRecommendedPercent = 20;
    marketNote = "Many two-wheeler lenders finance up to around 95% of on-road price.";
    safeNote = "BuyWise prefers 15% to 25% down payment to reduce EMI pressure.";
  }

  if (data.type === "car") {
    marketMinimumPercent = 0;
    safeRecommendedPercent = 20;
    marketNote = "Some banks may offer up to 100% on-road funding for eligible customers or selected cars.";
    safeNote = "BuyWise prefers 15% to 25% down payment because car ownership cost is high.";
  }

  const marketMinimumAmount = price * marketMinimumPercent / 100;
  const safeRecommendedAmount = price * safeRecommendedPercent / 100;
  const currentDownPaymentPercent = price > 0 ? data.downPayment / price * 100 : 0;
  const marketGap = Math.max(0, marketMinimumAmount - data.downPayment);
  const safeGap = Math.max(0, safeRecommendedAmount - data.downPayment);

  return {
    marketMinimumPercent,
    safeRecommendedPercent,
    marketMinimumAmount,
    safeRecommendedAmount,
    currentDownPaymentPercent,
    marketGap,
    safeGap,
    marketNote,
    safeNote
  };
}

function populatePurchaseSummary(data) {
  const typeName = titleCase(data.type);
  const config = purchaseConfig[data.type];
  const priceLabel = data.type === "phone" ? "Phone price" : `${typeName} price`;
  const downPaymentLabel = data.type === "phone" ? "Upfront payment" : "Down payment";
  const loanLabel = data.type === "phone" ? "EMI amount" : "Loan amount";
  const extraLabel = data.type === "phone" ? "Monthly accessories / insurance" : "Monthly ownership cost";

  document.querySelector("#purchase-summary-title").textContent = `${typeName} affordability check`;
  document.querySelector("#summary-type").textContent = typeName;
  document.querySelector("#summary-price").parentElement.querySelector("span").textContent = priceLabel;
  document.querySelector("#summary-price").textContent = money(data.purchasePrice);
  document.querySelector("#summary-down-payment").parentElement.querySelector("span").textContent = downPaymentLabel;
  document.querySelector("#summary-down-payment").textContent = money(data.downPayment);
  document.querySelector("#summary-loan").parentElement.querySelector("span").textContent = loanLabel;
  document.querySelector("#summary-loan").textContent = data.type === "phone" ? money(data.newEmi) : money(data.loanAmount);
  document.querySelector("#summary-tenure").textContent = tenureText(data);
  document.querySelector("#summary-interest").textContent = percent(data.interestRate);
  document.querySelector("#summary-extra").parentElement.querySelector("span").textContent = extraLabel;
  document.querySelector("#summary-extra").textContent = money(data.extraCost);

  const setupCard = document.querySelector("#summary-setup-card");
  const cashLeftCard = document.querySelector("#summary-cash-left-card");
  setupCard.classList.toggle("hidden", data.type !== "house");
  cashLeftCard.classList.toggle("hidden", data.type !== "house");
  if (data.type === "house") {
    document.querySelector("#summary-setup").textContent = money(data.setupCost);
    document.querySelector("#summary-cash-left").textContent = money(data.savingsLeft);
  }
}

function calculateBuyingPower(data) {
  const config = purchaseConfig[data.type];
  const dpStandard = getDownPaymentStandard(data);
  const minimumEmergencyReserve = data.minimumEmergencyFund;
  const comfortableEmergencyReserve = data.comfortableEmergencyFund;
  const cashNeededForSetup = data.type === "house" ? data.setupCost : 0;
  const maxSafeCashUsingMinimumReserve = Math.max(0, data.savings - cashNeededForSetup - minimumEmergencyReserve);
  const maxSafeCashUsingComfortableReserve = Math.max(0, data.savings - cashNeededForSetup - comfortableEmergencyReserve);
  const currentCashUsed = data.downPayment + cashNeededForSetup;
  const reserveProtected = comfortableEmergencyReserve;
  let suggestedDownPayment = data.downPayment;

  if (data.type === "house") {
    suggestedDownPayment = Math.min(
      data.purchasePrice,
      Math.max(data.downPayment, dpStandard.marketMinimumAmount, maxSafeCashUsingComfortableReserve)
    );
  } else if (data.type === "bike") {
    suggestedDownPayment = Math.min(
      data.purchasePrice,
      Math.max(data.downPayment, dpStandard.marketMinimumAmount, Math.min(maxSafeCashUsingComfortableReserve, dpStandard.safeRecommendedAmount))
    );
  } else if (data.type === "car") {
    suggestedDownPayment = Math.min(
      data.purchasePrice,
      Math.max(data.downPayment, Math.min(maxSafeCashUsingComfortableReserve, dpStandard.safeRecommendedAmount))
    );
  } else {
    suggestedDownPayment = Math.min(
      data.purchasePrice,
      Math.max(data.downPayment, Math.min(maxSafeCashUsingComfortableReserve, data.monthlyIncome * 0.3))
    );
  }

  const extraDownPaymentPossible = Math.max(0, suggestedDownPayment - data.downPayment);
  const suggestedLoanAmount = Math.max(0, data.purchasePrice - suggestedDownPayment);
  const suggestedEmi = calculateEmi(suggestedLoanAmount, data.interestRate, data.tenureMonths);
  const suggestedTotalOutflow = data.existingMonthlyEmi + suggestedEmi + data.extraCost;
  const suggestedRealMonthlySurplus = data.monthlyIncome - data.monthlyEssentialExpenses - suggestedTotalOutflow;
  const minimumSurplusToKeep = Math.max(
    data.monthlyEssentialExpenses * 0.25,
    data.monthlyIncome * 0.10
  );
  const safeEmiByRatio = (data.monthlyIncome * config.good / 100) - data.existingMonthlyEmi - data.extraCost;
  const stretchEmiByRatio = (data.monthlyIncome * config.caution / 100) - data.existingMonthlyEmi - data.extraCost;
  const safeEmiBySurplus = data.monthlyIncome - data.monthlyEssentialExpenses - data.existingMonthlyEmi - data.extraCost - minimumSurplusToKeep;
  const recommendedEmiCapacity = Math.max(0, Math.min(safeEmiByRatio, safeEmiBySurplus));
  const stretchEmiCapacity = Math.max(0, Math.min(stretchEmiByRatio, safeEmiBySurplus));
  const safeCashAvailable = maxSafeCashUsingComfortableReserve;

  if (data.emergencyFundGap > 0) {
    return {
      recommendedBudget: 0,
      stretchBudget: 0,
      avoidAboveBudget: 0,
      recommendedText: "Do not buy now",
      stretchText: "Not advised",
      avoidText: "Any new purchase",
      mainReason: "Emergency fund is below minimum",
      explanation: "BuyWise is not suggesting any purchase budget right now because your emergency fund will fall below the minimum 3-month level. First rebuild emergency savings, then check affordability again.",
      isNoBuyState: true,
      safeDeployableCash: safeCashAvailable,
      suggestedDownPayment: data.downPayment,
      extraDownPaymentPossible: 0,
      emergencyReserveProtected: reserveProtected,
      suggestedEmi,
      suggestedRealMonthlySurplus,
      suggestedLoanAmount
    };
  }

  const recommendedLoan = approximateLoanFromEmi(
    recommendedEmiCapacity,
    data.interestRate,
    Math.max(1, data.tenureMonths)
  );
  const stretchLoan = approximateLoanFromEmi(
    stretchEmiCapacity,
    data.interestRate,
    Math.max(1, data.tenureMonths)
  );

  let recommendedBudget = suggestedDownPayment + recommendedLoan;
  let stretchBudget = Math.max(suggestedDownPayment + stretchLoan, recommendedBudget);
  let avoidAboveBudget = Math.max(stretchBudget, data.purchasePrice);
  let mainReason = "Your budget is mainly limited by EMI capacity, emergency fund, and real monthly surplus.";
  let explanation = maxSafeCashUsingComfortableReserve > data.downPayment
    ? `You have savings available, but BuyWise protects emergency reserve first. After keeping a comfortable emergency fund, you can consider using around ${money(suggestedDownPayment)} as down payment.`
    : "Your savings should not be used for this purchase because it would reduce your emergency reserve.";

  if (recommendedEmiCapacity <= safeEmiByRatio && recommendedEmiCapacity <= safeEmiBySurplus) {
    mainReason = data.existingMonthlyEmi > 0
      ? "Your existing EMI already uses part of your income, so new EMI capacity is limited."
      : "After expenses and EMIs, your real monthly surplus is the main limit.";
  }
  if (safeEmiBySurplus < safeEmiByRatio) {
    mainReason = "After expenses and EMIs, your real monthly surplus is the main limit.";
  }

  if (data.type === "phone") {
    recommendedBudget = Math.min(recommendedBudget, data.monthlyIncome * 0.3);
    stretchBudget = Math.min(stretchBudget, data.monthlyIncome * 0.5);
    avoidAboveBudget = Math.max(stretchBudget, Math.min(data.purchasePrice, data.monthlyIncome));
    mainReason = data.emergencyMonths < 4
      ? "Phone EMI is close to the safer limit and emergency cushion is only slightly above minimum."
      : "Phones lose value quickly, so the safer budget is capped lower than your loan eligibility.";
    if (data.purchaseIncomeRatio > 1) {
      mainReason = "This phone is above 1 month of income. Phones depreciate fast, so avoid stretching or taking a long EMI.";
    }
  }

  if (data.type === "bike") {
    if (data.purchaseIncomeRatio > 5) {
      mainReason = "This bike is above 5 months of income. Fuel, servicing, insurance, helmet, tyres, repairs, and resale value make it a stretch.";
    } else if (data.purchaseIncomeRatio > 3) {
      mainReason = "Bike price is high against income, so keep room for fuel, servicing, insurance, helmet, tyres, repairs, and resale value.";
    } else {
      mainReason = "Bike EMI is manageable, but fuel, servicing, insurance, and repairs need monthly room.";
    }
  }

  if (data.type === "car") {
    mainReason = data.downPaymentPercent < 20
      ? "Car down payment is low, so reducing the car budget can keep EMI and ownership costs safer."
      : "Car ownership cost can rise beyond EMI due to fuel, parking, insurance, servicing, tyres, and depreciation.";
  }

  if (data.type === "house") {
    if (maxSafeCashUsingMinimumReserve < dpStandard.marketMinimumAmount) {
      recommendedBudget = 0;
      stretchBudget = 0;
      avoidAboveBudget = 0;
      mainReason = "Not enough safe cash for market-standard down payment and setup cost.";
      explanation = "House buying needs cash not only for down payment, but also setup, registration, interiors, furniture, repairs, and emergency reserve.";
    } else
    if (data.savings - data.downPayment - data.setupCost < data.minimumEmergencyFund) {
      recommendedBudget = 0;
      stretchBudget = 0;
      avoidAboveBudget = 0;
      mainReason = "House setup and registration costs reduce your cash below the emergency reserve. Build cash safety first.";
    } else {
      recommendedBudget = recommendedLoan + suggestedDownPayment;
      stretchBudget = stretchLoan + suggestedDownPayment;
      mainReason = "House buying needs extra cash for registration, setup, furniture, maintenance, and emergency reserve.";
      explanation = `House buying needs cash not only for down payment, but also setup, registration, interiors, furniture, repairs, and emergency reserve. Recommended house budget is ${money(recommendedBudget)} because EMI capacity supports about ${money(recommendedLoan)} loan and savings safely support about ${money(suggestedDownPayment)} down payment after keeping 6 months of emergency reserve.`;
    }
  }

  recommendedBudget = Math.max(0, recommendedBudget);
  stretchBudget = Math.max(recommendedBudget, stretchBudget);
  avoidAboveBudget = Math.max(stretchBudget, data.purchasePrice);
  if (data.type === "phone") {
    avoidAboveBudget = Math.max(stretchBudget, Math.min(data.purchasePrice, data.monthlyIncome));
  }

  return {
    recommendedBudget,
    stretchBudget,
    avoidAboveBudget,
    mainReason,
    explanation,
    isNoBuyState: false,
    safeDeployableCash: safeCashAvailable,
    suggestedDownPayment,
    extraDownPaymentPossible,
    emergencyReserveProtected: reserveProtected,
    suggestedEmi,
    suggestedRealMonthlySurplus,
    suggestedLoanAmount,
    maxSafeCashUsingMinimumReserve,
    maxSafeCashUsingComfortableReserve,
    currentCashUsed
  };
}

function saferBudget(data, safeEmiLimit, safeLoanAmount, buyingPower = null) {
  const config = purchaseConfig[data.type];
  const emergencyGapCopy = "You may have EMI capacity on paper, but this is not a safe time to buy. First close the emergency fund gap.";

  if (data.emergencyFundGap > 0) {
    return {
      price: 0,
      loan: 0,
      copy: emergencyGapCopy
    };
  }

  const emiBasedBudget = Math.max(0, safeLoanAmount + data.downPayment);
  if (data.type === "phone") {
    const incomeBasedPhoneBudget = data.monthlyIncome * 0.5;
    const cashSafePhoneBudget = Math.max(0, data.savings - data.minimumEmergencyFund);
    const saferPhoneBudget = Math.max(0, Math.min(data.purchasePrice, incomeBasedPhoneBudget, emiBasedBudget, cashSafePhoneBudget));
    let copy;
    if (cashSafePhoneBudget < data.purchasePrice) {
      copy = "EMI is manageable, but savings buffer is weak.";
    } else if (saferPhoneBudget >= data.purchasePrice) {
      copy = "Your selected phone price is within the safer range.";
    } else {
      copy = `A safer phone budget would be around ${money(saferPhoneBudget)}.`;
    }
    return {
      price: saferPhoneBudget,
      loan: Math.max(0, saferPhoneBudget - data.downPayment),
      copy
    };
  }

  const saferPurchasePrice = Math.max(0, Math.min(data.purchasePrice, emiBasedBudget));
  const selectedCopy = buyingPower && buyingPower.suggestedDownPayment > data.downPayment
    ? `With your current down payment, this purchase is risky. If you increase down payment to around ${money(buyingPower.suggestedDownPayment)} while keeping emergency reserve protected, EMI pressure may reduce.`
    : null;
  return {
    price: saferPurchasePrice,
    loan: Math.max(0, saferPurchasePrice - data.downPayment),
    copy: selectedCopy || (saferPurchasePrice >= data.purchasePrice
      ? `Your selected ${config.label} price is within the safer range, provided ownership costs are realistic.`
      : `Based on your current income, EMIs, and emergency fund, a safer ${config.label} budget would be around ${money(saferPurchasePrice)}.`)
  };
}

function renderResults(data) {
  const riskScore = scoreRisk(data);
  const verdictData = alignVerdictWithRisk(verdict(data), riskScore);
  const config = purchaseConfig[data.type];
  const advice = buildAdvice(data, verdictData);
  const theoreticalEmiCapacity = Math.max(0, (data.monthlyIncome * config.good / 100) - data.existingMonthlyEmi - data.extraCost);
  const safeEmiNow = data.emergencyFundGap > 0 ? 0 : theoreticalEmiCapacity;
  const safeLoanAmount = approximateLoanFromEmi(theoreticalEmiCapacity, data.interestRate, Math.max(1, data.tenureMonths));
  const buyingPower = calculateBuyingPower(data);
  const safeBudget = saferBudget(data, theoreticalEmiCapacity, safeLoanAmount, buyingPower);
  const dpStandard = getDownPaymentStandard(data);

  document.querySelector("#result-title").textContent = verdictData.title;
  const badge = document.querySelector("#risk-badge");
  badge.textContent = verdictData.label;
  badge.className = `risk-badge ${verdictData.level}`;
  const fill = document.querySelector("#risk-fill");
  fill.style.width = `${riskScore}%`;
  fill.style.background = verdictData.level === "good" ? "var(--success)" : verdictData.level === "caution" ? "var(--warning)" : "var(--risk)";

  populatePurchaseSummary(data);
  document.querySelector("#dp-current").textContent = money(data.downPayment);
  document.querySelector("#dp-current-percent").textContent = percent(dpStandard.currentDownPaymentPercent);
  document.querySelector("#dp-market-min").textContent = `${money(dpStandard.marketMinimumAmount)} (${percent(dpStandard.marketMinimumPercent)})`;
  document.querySelector("#dp-market-gap").textContent = money(dpStandard.marketGap);
  document.querySelector("#dp-safe-recommended").textContent = `${money(dpStandard.safeRecommendedAmount)} (${percent(dpStandard.safeRecommendedPercent)})`;
  document.querySelector("#dp-safe-gap").textContent = money(dpStandard.safeGap);
  document.querySelector("#down-payment-copy").textContent = `${dpStandard.marketNote} ${dpStandard.safeNote}`;
  document.querySelector("#buying-recommended").textContent = buyingPower.isNoBuyState ? buyingPower.recommendedText : money(buyingPower.recommendedBudget);
  document.querySelector("#buying-stretch").textContent = buyingPower.isNoBuyState ? buyingPower.stretchText : money(buyingPower.stretchBudget);
  document.querySelector("#buying-avoid").textContent = buyingPower.isNoBuyState ? buyingPower.avoidText : money(buyingPower.avoidAboveBudget);
  document.querySelector("#buying-reason").textContent = buyingPower.mainReason;
  document.querySelector("#buying-power-copy").textContent = buyingPower.explanation;
  document.querySelector("#buying-safe-cash").textContent = money(buyingPower.safeDeployableCash);
  document.querySelector("#buying-suggested-down").textContent = money(buyingPower.suggestedDownPayment);
  document.querySelector("#buying-extra-down").textContent = money(buyingPower.extraDownPaymentPossible);
  document.querySelector("#buying-reserve").textContent = money(buyingPower.emergencyReserveProtected);

  setMetric(metricIds.income, money(data.monthlyIncome));
  setMetric(metricIds.expenses, money(data.monthlyEssentialExpenses));
  document.querySelector("#expenses-note").textContent = data.expensesEntered ? "" : "Monthly expenses are estimated because you did not enter them.";
  setMetric(metricIds.existing, money(data.existingMonthlyEmi));
  setMetric(metricIds.newEmi, money(data.newEmi));
  setMetric(metricIds.emiRatio, percent(data.emiRatio));
  setMetric(metricIds.obligationRatio, percent(data.obligationRatio));
  setMetric(metricIds.extra, money(data.extraCost));
  setMetric(metricIds.outflow, money(data.totalOutflow));
  setMetric(metricIds.balanceAfterEmi, money(data.balanceAfterEmi));
  setMetric(metricIds.realSurplus, money(data.realMonthlySurplus));
  setMetric(metricIds.savings, money(data.savings));
  setMetric(metricIds.savingsLeft, money(data.savingsLeft));
  setMetric(metricIds.emergencyCover, emergencyCoverText(data.emergencyMonths));
  setMetric(metricIds.minEmergency, money(data.minimumEmergencyFund));
  setMetric(metricIds.emergencyGap, money(data.emergencyFundGap));
  setMetric(metricIds.theoreticalEmi, money(theoreticalEmiCapacity));
  setMetric(metricIds.safeEmiNow, money(safeEmiNow));
  setMetric(metricIds.safeLoan, money(safeBudget.loan));
  setMetric(metricIds.safePrice, money(safeBudget.price));
  document.querySelector("#selected-current-down").textContent = money(data.downPayment);
  document.querySelector("#selected-suggested-down").textContent = money(buyingPower.suggestedDownPayment);
  document.querySelector("#selected-current-emi").textContent = money(data.newEmi);
  document.querySelector("#selected-suggested-emi").textContent = money(buyingPower.suggestedEmi);
  document.querySelector("#selected-suggested-surplus").textContent = money(buyingPower.suggestedRealMonthlySurplus);

  document.querySelector("#why-buy-title").textContent = verdictData.level === "good" ? "Why you can buy" : "What is still okay";
  document.querySelector("#why-buy").textContent = advice.whyBuy;
  document.querySelector("#why-wait-title").textContent =
    verdictData.level === "good" ? "What to still watch" :
    verdictData.level === "caution" ? "Why this is caution" :
    "Why you should wait";
  document.querySelector("#why-wait").textContent = advice.whyWait;
  document.querySelector("#what-wrong").textContent = advice.whatWrong;
  document.querySelector("#next-step").textContent = advice.nextStep;
  document.querySelector("#safer-budget-copy").textContent = safeBudget.copy;

  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function saveState() {
  const state = {
    purchaseType: selectedPurchaseType(),
    incomeType: document.querySelector("#income-type").value,
    incomeAmount: document.querySelector("#income-amount").value,
    monthlyExpenses: document.querySelector("#monthly-expenses").value,
    savings: document.querySelector("#savings").value,
    purchasePrice: document.querySelector("#purchase-price")?.value || "",
    purchaseDownPayment: document.querySelector("#purchase-down-payment")?.value || "",
    purchaseTenure: document.querySelector("#purchase-tenure")?.value || "",
    interestRate: document.querySelector("#interest-rate")?.value || "",
    extraCost: document.querySelector("#extra-cost")?.value || "",
    setupCost: document.querySelector("#setup-cost")?.value || "",
    emis: getExistingEmis().map(({ name, amount, frequency }) => ({ name, amount, frequency }))
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreState() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  const theme = localStorage.getItem(THEME_KEY) || "light";
  setTheme(theme);
  renderPurchaseFields(saved?.purchaseType || "phone");
  if (!saved) return;

  document.querySelector("#purchase-type").value = saved.purchaseType || "phone";
  document.querySelector("#income-type").value = saved.incomeType || "monthly";
  document.querySelector("#income-amount").value = saved.incomeAmount || "";
  document.querySelector("#monthly-expenses").value = saved.monthlyExpenses || "";
  document.querySelector("#savings").value = saved.savings || "";
  document.querySelector("#purchase-price").value = saved.purchasePrice || "";
  document.querySelector("#purchase-down-payment").value = saved.purchaseDownPayment || "";
  document.querySelector("#purchase-tenure").value = saved.purchaseTenure || "";
  document.querySelector("#interest-rate").value = saved.interestRate || "";
  document.querySelector("#extra-cost").value = saved.extraCost || "";
  if (document.querySelector("#setup-cost")) document.querySelector("#setup-cost").value = saved.setupCost || "";
  (saved.emis || []).forEach(addEmiRow);
  normalizeNumericInputs(document);
  updateExistingEmiTotal();
}

document.querySelector("#purchase-type").addEventListener("change", (event) => {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  renderPurchaseFields(event.target.value);
  document.querySelector("#purchase-down-payment").value = saved.purchaseDownPayment || "";
  saveState();
});

form.addEventListener("input", (event) => {
  if (event.target.matches("[data-number='currency']")) {
    const rawValue = event.target.value;
    const caretAtEnd = event.target.selectionStart === rawValue.length;
    event.target.value = formatNumberForInput(rawValue);
    if (caretAtEnd) event.target.setSelectionRange(event.target.value.length, event.target.value.length);
  }
  validationMessage.textContent = "";
  updateExistingEmiTotal();
  saveState();
});

form.addEventListener("change", () => {
  updateExistingEmiTotal();
  saveState();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = collectData();
  const message = validateInputs(data);
  if (message) {
    validationMessage.textContent = message;
    results.classList.add("hidden");
    return;
  }
  validationMessage.textContent = "";
  renderResults(data);
  saveState();
});

addEmiButton.addEventListener("click", () => {
  addEmiRow();
  saveState();
});

resetButton.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  form.reset();
  emiList.innerHTML = "";
  renderPurchaseFields("phone");
  document.querySelector("#purchase-type").value = "phone";
  updateExistingEmiTotal();
  validationMessage.textContent = "";
  results.classList.add("hidden");
});

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  setTheme(current === "dark" ? "light" : "dark");
});

restoreState();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Offline support is optional at runtime; the calculator still works if registration is blocked locally.
    });
  });
}
