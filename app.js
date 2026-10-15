/**
 * GrowMore Fintech Core Engine
 * Manages real-time state, user balances, plan activations,
 * transactions, live ticker, sound effects, and PWA installs.
 */

class GrowMoreEngine {
  constructor() {
    this.defaultState = {
      user: {
        name: "Rahul Sharma",
        id: "GM12345",
        email: "rahul@gmail.com",
        phone: "+91 98765 43210",
        bankMasked: "••••• 1234",
        upiId: "rahul@okhdfcbank",
        verified: true,
        referralCode: "GM12345",
        referralLink: "https://growmore.in/r/GM12345",
        totalInvites: 12,
        referralEarnings: 2400
      },
      balance: 12480.00,
      totalEarnings: 3240.00,
      activeInvestments: 8000.00,
      referralBonus: 560.00,
      dailyIncome: 180.00,
      nextIncomeSeconds: 8115, // 2h 15m 15s
      plans: [
        {
          id: "plan-1",
          name: "Growth Plan",
          invested: 1000,
          expectedReturn: 2400,
          returnRate: "140%",
          durationDays: 7,
          daysLeft: 4,
          progress: 68,
          startDate: "08 Apr 2025",
          maturityDate: "15 Apr 2025",
          status: "Active"
        },
        {
          id: "plan-2",
          name: "Standard Plan",
          invested: 5000,
          expectedReturn: 7500,
          returnRate: "150%",
          durationDays: 7,
          daysLeft: 5,
          progress: 35,
          startDate: "10 Apr 2025",
          maturityDate: "17 Apr 2025",
          status: "Active"
        }
      ],
      transactions: [
        { id: "tx-1", date: "12 Apr 2025", type: "Investment", plan: "Growth Plan", amount: -1000.00, status: "Success", method: "UPI" },
        { id: "tx-2", date: "10 Apr 2025", type: "Profit Credited", plan: "Micro ₹10 Plan", amount: +1400.00, status: "Success", method: "Auto-Credit" },
        { id: "tx-3", date: "08 Apr 2025", type: "Referral Bonus", plan: "Level 1 Invite", amount: +200.00, status: "Success", method: "Bonus" },
        { id: "tx-4", date: "05 Apr 2025", type: "Deposit", plan: "Instant UPI", amount: +5000.00, status: "Success", method: "PhonePe" },
        { id: "tx-5", date: "02 Apr 2025", type: "Withdrawal", plan: "Bank Payout", amount: -2500.00, status: "Success", method: "IMPS" }
      ]
    };

    this.state = this.loadState();
    this.deferredPrompt = null;
    this.audioCtx = null;

    this.init();
  }

  loadState() {
    try {
      const saved = localStorage.getItem("growmore_state");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Storage read failed, using defaults:", e);
    }
    return JSON.parse(JSON.stringify(this.defaultState));
  }

  saveState() {
    try {
      localStorage.setItem("growmore_state", JSON.stringify(this.state));
    } catch (e) {
      console.warn("Storage save failed:", e);
    }
    this.render();
  }

  resetState() {
    this.state = JSON.parse(JSON.stringify(this.defaultState));
    this.saveState();
    this.showToast("Demo data reset to default successfully", "success");
  }

  init() {
    this.render();
    this.startPayoutTimer();
    this.initCalculator();
    this.initPWA();
    this.initLiveActivityFeed();
  }

  // --- Sound Effects using Web Audio API ---
  playSound(type = "click") {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === "success" || type === "coin") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, this.audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.25);
      } else {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.08);
      }
    } catch (e) {
      // Audio not permitted or supported
    }
  }

  // --- Live Countdown Timer for Next Payout ---
  startPayoutTimer() {
    setInterval(() => {
      if (this.state.nextIncomeSeconds > 0) {
        this.state.nextIncomeSeconds--;
      } else {
        // Automatically credit profit tick!
        const profitTick = 4.20;
        this.state.balance += profitTick;
        this.state.totalEarnings += profitTick;
        this.state.nextIncomeSeconds = 8100; // Reset to 2h 15m
        this.state.transactions.unshift({
          id: "tx-" + Date.now(),
          date: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
          type: "Profit Credited",
          plan: "Daily Profit Share",
          amount: profitTick,
          status: "Success",
          method: "Auto-Yield"
        });
        this.saveState();
        this.showToast(`Profit Auto-Credited: +₹${profitTick.toFixed(2)} to Balance!`, "success");
      }
      this.updateTimerDisplay();
    }, 1000);
  }

  updateTimerDisplay() {
    const sec = this.state.nextIncomeSeconds;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const formatted = `${h}h ${m < 10 ? '0' : ''}${m}m ${s < 10 ? '0' : ''}${s}s`;
    
    document.querySelectorAll(".payout-countdown").forEach(el => {
      el.textContent = formatted;
    });
  }

  // --- Render Function: Synchronizes all web & app displays ---
  render() {
    const formatINR = (val) => "₹ " + Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Update balances
    document.querySelectorAll(".user-balance-val").forEach(el => el.textContent = formatINR(this.state.balance));
    document.querySelectorAll(".user-earnings-val").forEach(el => el.textContent = formatINR(this.state.totalEarnings));
    document.querySelectorAll(".user-invested-val").forEach(el => el.textContent = formatINR(this.state.activeInvestments));
    document.querySelectorAll(".user-referral-val").forEach(el => el.textContent = formatINR(this.state.referralBonus));
    document.querySelectorAll(".user-daily-income").forEach(el => el.textContent = formatINR(this.state.dailyIncome));
    document.querySelectorAll(".user-invites-count").forEach(el => el.textContent = this.state.user.totalInvites);

    // Update Transaction Tables in Web Dashboard
    const txTableBody = document.querySelector("#dashTxTableBody");
    if (txTableBody) {
      txTableBody.innerHTML = this.state.transactions.slice(0, 6).map(tx => {
        const isPlus = tx.amount > 0;
        const amtStr = (isPlus ? "+ " : "- ") + formatINR(Math.abs(tx.amount));
        const colorClass = isPlus ? "style='color: var(--accent-green); font-weight:700;'" : "style='color: #cbd5e1; font-weight:600;'";
        return `
          <tr>
            <td>${tx.date}</td>
            <td><strong>${tx.type}</strong><br><small style="color:var(--text-muted);">${tx.plan}</small></td>
            <td ${colorClass}>${amtStr}</td>
            <td><span class="status-badge success">Success</span></td>
          </tr>
        `;
      }).join('');
    }

    // Update Active Plans View
    const activePlan = this.state.plans[0];
    if (activePlan) {
      document.querySelectorAll(".active-plan-amt").forEach(el => el.textContent = formatINR(activePlan.invested));
      document.querySelectorAll(".active-plan-expected").forEach(el => el.textContent = formatINR(activePlan.expectedReturn));
      document.querySelectorAll(".active-plan-return-rate").forEach(el => el.textContent = `${activePlan.returnRate} in ${activePlan.durationDays} Days`);
      document.querySelectorAll(".active-plan-progress-fill").forEach(el => el.style.width = `${activePlan.progress}%`);
      document.querySelectorAll(".active-plan-progress-percent").forEach(el => el.textContent = `${activePlan.progress}%`);
      document.querySelectorAll(".active-plan-maturity").forEach(el => el.textContent = `Maturity in ${activePlan.daysLeft} days`);
    }

    this.updateTimerDisplay();
  }

  // --- Deposit Funds (Simulated Real UPI / Gateway) ---
  depositFunds(amount, method = "UPI") {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) {
      this.showToast("Please enter a valid deposit amount", "error");
      return false;
    }

    this.state.balance += amount;
    this.state.transactions.unshift({
      id: "tx-" + Date.now(),
      date: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      type: "Deposit",
      plan: "Instant " + method,
      amount: amount,
      status: "Success",
      method: method
    });

    this.saveState();
    this.playSound("coin");
    this.showToast(`Deposit Successful! ₹${amount.toLocaleString()} credited to your account.`, "success");
    return true;
  }

  // --- Invest in a Plan ---
  investInPlan(planName, amount, returnMultiplier = 1.4, durationDays = 7) {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) {
      this.showToast("Invalid investment amount", "error");
      return false;
    }

    if (this.state.balance < amount) {
      this.showToast(`Insufficient Balance! You have ₹${this.state.balance.toFixed(2)}. Please deposit first.`, "error");
      this.openModal("depositModal");
      return false;
    }

    // Deduct balance and add active investment
    this.state.balance -= amount;
    this.state.activeInvestments += amount;
    const expectedReturn = amount * returnMultiplier;

    const newPlan = {
      id: "plan-" + Date.now(),
      name: planName,
      invested: amount,
      expectedReturn: expectedReturn,
      returnRate: `${Math.round(returnMultiplier * 100 - 100)}%`,
      durationDays: durationDays,
      daysLeft: durationDays,
      progress: 5,
      startDate: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      maturityDate: new Date(Date.now() + durationDays * 86400000).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      status: "Active"
    };

    this.state.plans.unshift(newPlan);
    this.state.transactions.unshift({
      id: "tx-" + Date.now(),
      date: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      type: "Investment",
      plan: planName,
      amount: -amount,
      status: "Success",
      method: "Wallet Balance"
    });

    this.saveState();
    this.playSound("coin");
    this.showToast(`Investment Confirmed! ₹${amount.toLocaleString()} locked in ${planName}.`, "success");
    return true;
  }

  // --- Withdraw Funds ---
  withdrawFunds(amount, method = "UPI", destination = "") {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount < 50) {
      this.showToast("Minimum withdrawal amount is ₹50", "error");
      return false;
    }

    if (this.state.balance < amount) {
      this.showToast("Insufficient balance for withdrawal", "error");
      return false;
    }

    this.state.balance -= amount;
    this.state.transactions.unshift({
      id: "tx-" + Date.now(),
      date: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }),
      type: "Withdrawal",
      plan: destination || method,
      amount: -amount,
      status: "Success",
      method: method
    });

    this.saveState();
    this.playSound("coin");
    this.showToast(`Withdrawal Request of ₹${amount.toLocaleString()} Sent! Processed to ${destination || method} in 15 mins.`, "success");
    return true;
  }

  // --- Interactive Profit Calculator Logic ---
  initCalculator() {
    const input = document.getElementById("calcAmountInput");
    const slider = document.getElementById("calcAmountSlider");
    const chips = document.querySelectorAll(".calc-chip");
    const durationBtns = document.querySelectorAll(".duration-btn");
    let multiplier = 2.4; // 140% profit = 2.4x return

    if (!input || !slider) return;

    const calculate = (amt) => {
      amt = Math.max(1, parseFloat(amt) || 1);
      const returnAmt = amt * multiplier;
      const profit = returnAmt - amt;
      const dailyProfit = profit / 7;

      const retEl = document.getElementById("calcTotalReturnVal");
      const profitEl = document.getElementById("calcProfitVal");
      const dailyEl = document.getElementById("calcDailyVal");

      if (retEl) retEl.textContent = "₹ " + returnAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (profitEl) profitEl.textContent = "+ ₹ " + profit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (dailyEl) dailyEl.textContent = "₹ " + dailyProfit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    input.addEventListener("input", (e) => {
      slider.value = e.target.value;
      calculate(e.target.value);
    });

    slider.addEventListener("input", (e) => {
      input.value = e.target.value;
      calculate(e.target.value);
    });

    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const val = chip.dataset.amount;
        input.value = val;
        slider.value = val;
        calculate(val);
        this.playSound("click");
      });
    });

    durationBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        durationBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const days = parseInt(btn.dataset.days);
        if (days === 7) multiplier = 2.4;
        else if (days === 10) multiplier = 2.6;
        else if (days === 14) multiplier = 3.0;
        calculate(input.value);
        this.playSound("click");
      });
    });

    calculate(1000);
  }

  // --- Live Simulated Activity Feed ---
  initLiveActivityFeed() {
    const names = ["Rohit K.", "Sneha V.", "Amit S.", "Pooja Y.", "Vikram R.", "Ananya M.", "Rajesh P.", "Kunal G."];
    const actions = [
      { text: "invested ₹ 1,000 in Starter Plan", type: "invest" },
      { text: "withdrew ₹ 2,400 to UPI", type: "withdraw" },
      { text: "earned ₹ 140 daily return", type: "profit" },
      { text: "invested ₹ 5,000 in Gold Plan", type: "invest" },
      { text: "received ₹ 200 referral bonus", type: "referral" },
      { text: "withdrew ₹ 5,000 to Bank Account", type: "withdraw" }
    ];

    setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const container = document.getElementById("liveActivityTrack");
      if (container) {
        const item = document.createElement("div");
        item.className = "ticker-item";
        item.innerHTML = `<span class="ticker-dot"></span> <strong>${name}</strong> ${action.text} <span style="color:var(--text-muted); font-size:11px;">just now</span>`;
        container.prepend(item);
        if (container.children.length > 10) {
          container.removeChild(container.lastChild);
        }
      }
    }, 4500);
  }

  // --- Copy Referral Link ---
  copyReferralLink() {
    navigator.clipboard.writeText(this.state.user.referralLink).then(() => {
      this.playSound("success");
      this.showToast("Referral link copied to clipboard: " + this.state.user.referralLink, "success");
    }).catch(() => {
      this.showToast("Referral Link: " + this.state.user.referralLink, "success");
    });
  }

  // --- Modal Helpers ---
  openModal(modalId) {
    this.playSound("click");
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
  }

  closeModal(modalId) {
    this.playSound("click");
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
  }

  closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  }

  // --- Toast System ---
  showToast(message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === "success" ? "✓" : (type === "error" ? "✕" : "ℹ");
    toast.innerHTML = `<span style="font-size:16px;">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(15px)";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Progressive Web App Install Handler ---
  initPWA() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      document.querySelectorAll(".pwa-install-btn").forEach(btn => {
        btn.style.display = "inline-flex";
        btn.addEventListener("click", () => {
          if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === "accepted") {
                this.showToast("Thank you for installing GrowMore App!", "success");
              }
              this.deferredPrompt = null;
            });
          }
        });
      });
    });
  }
}

// Global instance
window.growEngine = new GrowMoreEngine();
