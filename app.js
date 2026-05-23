const STORAGE_KEYS = {
  trips: 'swissTripTrips',
  currentTrip: 'swissTripCurrentTrip',
};

const itineraryForm = document.getElementById('itinerary-form');
const itineraryList = document.getElementById('itinerary-list');
const receiptFile = document.getElementById('receipt-file');
const receiptText = document.getElementById('receipt-text');
const receiptAmount = document.getElementById('receipt-amount');
const receiptPayer = document.getElementById('receipt-payer');
const receiptSplitAll = document.getElementById('receipt-split-all');
const receiptSplitMode = document.getElementById('receipt-split-mode');
const receiptDebtOptions = document.getElementById('receipt-debt-options');
const addReceiptButton = document.getElementById('add-receipt');
const receiptsList = document.getElementById('receipts-list');
const itineraryFile = document.getElementById('itinerary-file');
const itineraryExtracted = document.getElementById('itinerary-extracted');
const importItineraryButton = document.getElementById('import-itinerary');
const participantName = document.getElementById('participant-name');
const addParticipantButton = document.getElementById('add-participant');
const participantsList = document.getElementById('participants-list');
const totalSpent = document.getElementById('total-spent');
const splitAmount = document.getElementById('split-amount');
const balancesList = document.getElementById('balances-list');
const notesTextarea = document.getElementById('item-notes');
const boldButton = document.getElementById('format-bold');
const italicButton = document.getElementById('format-italic');
const underlineButton = document.getElementById('format-underline');
const headingButton = document.getElementById('format-heading');
const blueButton = document.getElementById('format-blue');
const pinkButton = document.getElementById('format-pink');
const roseButton = document.getElementById('format-rose');
const amberButton = document.getElementById('format-amber');
const greenButton = document.getElementById('format-green');
const goldButton = document.getElementById('format-gold');
const linkButton = document.getElementById('format-link');
const appSecretInput = document.getElementById('app-secret');
const loadBackendButton = document.getElementById('load-backend');
const saveBackendButton = document.getElementById('save-backend');
const tripNameInput = document.getElementById('trip-name');

const tripSelect = document.getElementById('trip-select');
const newTripButton = document.getElementById('new-trip');
const saveTripButton = document.getElementById('save-trip');
const deleteTripButton = document.getElementById('delete-trip');
const bottomSaveJourneyButton = document.getElementById('bottom-save-journey');
const scrollTopButton = document.getElementById('scroll-top');

let trips = loadState(STORAGE_KEYS.trips, []);
let currentTripId = localStorage.getItem(STORAGE_KEYS.currentTrip);
let itinerary = [];
let participants = [];
let receipts = [];
let editingItemId = null;

function loadState(key, defaultValue) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
}

function saveState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCurrentTrip() {
  return trips.find(trip => trip.id === currentTripId) || trips[0] || null;
}

function saveTrips() {
  saveState(STORAGE_KEYS.trips, trips);
  localStorage.setItem(STORAGE_KEYS.currentTrip, currentTripId || '');
}

function setCurrentTripData(trip) {
  itinerary = trip.itinerary ? [...trip.itinerary] : [];
  participants = trip.participants ? [...trip.participants] : [];
  receipts = trip.receipts ? [...trip.receipts] : [];
}

function loadTrip(id) {
  const trip = trips.find(item => item.id === id);
  if (!trip) return;
  currentTripId = trip.id;
  tripNameInput.value = trip.name;
  setCurrentTripData(trip);
  saveTrips();
  renderTripSelector();
  renderParticipants();
  renderItinerary();
  renderReceipts();
  renderSummary();
}

function renderTripSelector() {
  tripSelect.innerHTML = '';
  trips.forEach(trip => {
    const opt = document.createElement('option');
    opt.value = trip.id;
    opt.textContent = trip.name;
    tripSelect.appendChild(opt);
  });
  if (currentTripId) tripSelect.value = currentTripId;
}

function saveCurrentTripState() {
  const trip = getCurrentTrip();
  if (!trip) return;
  trip.name = tripNameInput.value.trim() || trip.name;
  trip.itinerary = [...itinerary];
  trip.participants = [...participants];
  trip.receipts = [...receipts];
  trip.updatedAt = new Date().toISOString();
  saveTrips();
  renderTripSelector();
}

function updateScrollTopButton() {
  if (!scrollTopButton) return;
  scrollTopButton.classList.toggle('is-visible', window.scrollY > 360);
}

async function loadFromBackend() {
  const secret = appSecretInput.value.trim();
  if (!secret) {
    alert('Enter your journey secret before loading.');
    return;
  }

  localStorage.setItem('swissTripAppSecret', secret);

  try {
    const response = await fetch('/.netlify/functions/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });
    const responseText = await response.text();
    if (!response.ok) {
      const message = responseText || 'Unable to load journey data.';
      throw new Error(message);
    }
    const data = JSON.parse(responseText || '{}');
    if (!data.trip) {
      alert('No journey found for that secret. Save your current journey first.');
      return;
    }

    const loadedTrip = data.trip;
    const existing = trips.find(item => item.id === loadedTrip.id);
    if (existing) {
      Object.assign(existing, loadedTrip);
    } else {
      trips.unshift(loadedTrip);
    }
    currentTripId = loadedTrip.id;
    saveTrips();
    loadTrip(currentTripId);
  } catch (error) {
    console.error(error);
    alert(`Failed to load journey from backend. ${error.message || ''} Make sure the local server is running with npm start.`);
  }
}

async function saveToBackend() {
  let secret = appSecretInput.value.trim();
  if (!secret) {
    secret = prompt('Enter a unique journey secret to save this journey. Use this secret to load it later.');
    if (!secret || !secret.trim()) {
      alert('Journey secret is required to save.');
      return;
    }
    secret = secret.trim();
    appSecretInput.value = secret;
  }

  saveCurrentTripState();
  const trip = getCurrentTrip();
  if (!trip) {
    alert('Create or select a journey before saving.');
    return;
  }

  localStorage.setItem('swissTripAppSecret', secret);

  try {
    const response = await fetch('/.netlify/functions/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, trip }),
    });
    const responseText = await response.text();
    if (!response.ok) {
      const message = responseText || 'Unable to save journey data.';
      throw new Error(message);
    }
    alert('Journey saved✨');
  } catch (error) {
    console.error(error);
    alert(`Failed to save journey to backend. ${error.message || ''} Make sure the local server is running with npm start.`);
  }
}

function createNewTrip(name) {
  const newTrip = {
    id: createId(),
    name: name || `Journey ${trips.length + 1}`,
    itinerary: [],
    participants: [],
    receipts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  trips.unshift(newTrip);
  currentTripId = newTrip.id;
  saveTrips();
  loadTrip(newTrip.id);
}

function ensureDefaultTrip() {
  if (!trips.length) {
    createNewTrip('My first journey');
  } else if (!currentTripId || !trips.some(trip => trip.id === currentTripId)) {
    currentTripId = trips[0].id;
    loadTrip(currentTripId);
  } else {
    loadTrip(currentTripId);
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function toCents(value) {
  return Math.round(Number(value || 0) * 100);
}

function fromCents(cents) {
  return cents / 100;
}

function renderParticipants() {
  participantsList.innerHTML = '';
  participants.forEach((name, index) => {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `${name} <button aria-label="Remove ${name}" data-index="${index}">&times;</button>`;
    participantsList.appendChild(tag);
  });
  renderPayerOptions();
}
function renderPayerOptions() {
  receiptPayer.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select payer';
  placeholder.disabled = true;
  placeholder.selected = true;
  receiptPayer.appendChild(placeholder);
  participants.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    receiptPayer.appendChild(opt);
  });
  renderReceiptDebtOptions();
}

function renderReceiptDebtOptions() {
  if (!receiptDebtOptions) return;
  const payer = receiptPayer.value;
  const splitMode = receiptSplitMode ? receiptSplitMode.value : 'equal';
  const otherParticipants = participants.filter(name => name !== payer);
  receiptDebtOptions.innerHTML = '';
  if (!payer) {
    receiptDebtOptions.innerHTML = '<p class="hint">Select one payer before choosing how the receipt is split.</p>';
    return;
  }
  if (splitMode !== 'custom' && otherParticipants.length === 0) {
    receiptDebtOptions.innerHTML = '<p class="hint">Add another participant to choose who owes that payer.</p>';
    return;
  }

  const hint = document.createElement('p');
  hint.className = 'hint';
  const participantScope = receiptSplitAll && receiptSplitAll.checked ? 'All participants' : `${payer} and selected participants`;
  hint.textContent = splitMode === 'custom'
    ? `Enter what each participant owes ${payer}. ${payer}'s share is calculated from the remaining receipt total, and zero amounts are allowed.`
    : `${participantScope} will share this receipt equally.`;
  receiptDebtOptions.appendChild(hint);

  const wrapper = document.createElement('div');
  wrapper.className = 'debt-list';
  const splitParticipants = otherParticipants;
  splitParticipants.forEach(name => {
    const row = document.createElement('div');
    row.className = 'debt-person-row';

    const label = document.createElement('label');
    label.className = 'debt-checkbox';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'receipt-debt-checkbox';
    checkbox.dataset.name = name;
    checkbox.checked = true;
    checkbox.disabled = splitMode === 'custom' || (receiptSplitAll && receiptSplitAll.checked);
    label.appendChild(checkbox);
    label.append(`${name} owes ${payer}`);
    row.appendChild(label);

    if (splitMode === 'custom') {
      const amount = document.createElement('input');
      amount.type = 'number';
      amount.className = 'receipt-debt-amount';
      amount.dataset.name = name;
      amount.placeholder = '0.00';
      amount.step = '0.01';
      amount.min = '0';
      row.appendChild(amount);
    }

    wrapper.appendChild(row);
  });
  receiptDebtOptions.appendChild(wrapper);
}

function getItinerarySortValue(dayLabel) {
  const label = dayLabel || '';
  const isoDate = label.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoDate) {
    const parsed = Date.parse(`${isoDate[0]}T00:00:00`);
    if (Number.isFinite(parsed)) return parsed;
  }

  const looseDate = label.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
  if (looseDate) {
    const parsed = Date.parse(looseDate[0]);
    if (Number.isFinite(parsed)) return parsed;
  }

  const dayNumber = label.match(/\bday\s*(\d+)\b/i);
  if (dayNumber) return Number(dayNumber[1]);

  return Number.MAX_SAFE_INTEGER;
}

function getTimeSortValue(timeLabel) {
  const match = (timeLabel || '').match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return Number.MAX_SAFE_INTEGER;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function renderItinerary() {
  itineraryList.innerHTML = '';
  if (!itinerary.length) {
    itineraryList.innerHTML = '<div class="card list-item"><p>No itinerary items yet. Add your first stop.</p></div>';
    return;
  }

  const groups = itinerary.reduce((acc, item) => {
    const key = item.day || 'Unscheduled';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  Object.entries(groups)
    .sort(([dayA], [dayB]) => {
      const sortA = getItinerarySortValue(dayA);
      const sortB = getItinerarySortValue(dayB);
      if (sortA !== sortB) return sortA - sortB;
      return dayA.localeCompare(dayB);
    })
    .forEach(([day, items]) => {
      const sortedItems = [...items].sort((a, b) => {
        const timeA = getTimeSortValue(a.time);
        const timeB = getTimeSortValue(b.time);
        if (timeA !== timeB) return timeA - timeB;
        return (a.location || '').localeCompare(b.location || '');
      });

    const card = document.createElement('div');
    card.className = 'list-item itinerary-day-card';
    card.innerHTML = `
      <div class="itinerary-day-header">
        <span class="date-pill">${day}</span>
      </div>
      <div class="itinerary-day-items">
        ${sortedItems.map(item => `
          <div class="itinerary-entry">
            <div class="itinerary-entry-main">
              <h3>${item.location || 'Untitled activity'}</h3>
              <div class="note-content">${formatNotes(item.notes)}</div>
            </div>
            <div class="actions">
              <button class="edit-btn" data-id="${item.id}">Edit</button>
              <button class="delete-btn" data-id="${item.id}">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    itineraryList.appendChild(card);
    });
}

function renderReceipts() {
  receiptsList.innerHTML = '';
  if (!receipts.length) {
    receiptsList.innerHTML = '<div class="card list-item"><p>No receipt entries yet. Add receipts, then split after the trip.</p></div>';
    return;
  }

  receipts.forEach(entry => {
    const unsettledShares = entry.shares.filter(share => share.name !== entry.payer && !share.settled);
    const isSettled = unsettledShares.length === 0;
    const shareRows = entry.shares
      .filter(share => share.name !== entry.payer && share.amount > 0)
      .map(share => `
        <div class="share-row">
          <label>
            <input type="checkbox" class="receipt-share-checkbox" data-id="${entry.id}" data-name="${share.name}" ${share.settled ? 'checked' : ''} />
            ${share.name} owes ${entry.payer} ${formatCurrency(share.amount)}
          </label>
          <span class="${share.settled ? 'paid-state' : 'unpaid-state'}">${share.settled ? `Paid${share.paidAt ? ` on ${new Date(share.paidAt).toLocaleDateString()}` : ''}` : 'Unpaid'}</span>
        </div>
      `)
      .join('');

    const card = document.createElement('div');
    card.className = 'list-item';
    card.innerHTML = `
      <div class="item-row">
        <h3>${entry.description || 'Receipt entry'}</h3>
        <span class="status-pill ${isSettled ? 'status-settled' : 'status-pending'}">${isSettled ? 'Settled' : 'Owing'}</span>
      </div>
      <div class="item-meta"><span>Paid by ${entry.payer}</span><span>${formatCurrency(entry.amount)}</span><span>${entry.splitMode === 'custom' ? 'Custom split' : 'Equal split'}</span><span>${isSettled ? 'All paid' : 'Waiting for payment'}</span></div>
      <p>${entry.rawText ? entry.rawText : 'No receipt text provided.'}</p>
      <div class="receipt-payment-section">
        <h4>Paid / unpaid to ${entry.payer}</h4>
        ${shareRows || '<p class="hint">No participants owe this payer.</p>'}
      </div>
      <div class="actions">
        <button class="delete-btn" data-id="${entry.id}">Remove</button>
      </div>
    `;
    receiptsList.appendChild(card);
  });
}

function renderSummary() {
  const totalCents = receipts.reduce((sum, item) => sum + toCents(item.amount), 0);
  totalSpent.textContent = formatCurrency(fromCents(totalCents));
  const unsettledTotalCents = receipts.reduce((sum, item) => {
    return sum + item.shares.filter(share => share.name !== item.payer && !share.settled).reduce((sub, share) => sub + toCents(share.amount), 0);
  }, 0);
  splitAmount.textContent = formatCurrency(fromCents(unsettledTotalCents));

  balancesList.innerHTML = '';
  const owesBreakdownElement = document.getElementById('owes-breakdown');
  if (owesBreakdownElement) owesBreakdownElement.innerHTML = '';
  if (!participants.length) {
    balancesList.innerHTML = '<div class="card list-item"><p>Add participants to calculate share balances.</p></div>';
    if (owesBreakdownElement) owesBreakdownElement.innerHTML = '<div class="card list-item"><p>No debts until participants are added.</p></div>';
    return;
  }

  const net = participants.reduce((acc, name) => {
    acc[name] = 0;
    return acc;
  }, {});
  const owedByPair = receipts.reduce((acc, item) => {
    item.shares
      .filter(share => share.name !== item.payer && !share.settled && share.amount > 0)
      .forEach(share => {
        const key = `${share.name}|||${item.payer}`;
        if (!acc[key]) {
          acc[key] = { from: share.name, to: item.payer, amount: 0, receiptCount: 0 };
        }
        acc[key].amount += share.amount;
        acc[key].receiptCount += 1;
        if (net[share.name] === undefined) net[share.name] = 0;
        if (net[item.payer] === undefined) net[item.payer] = 0;
        net[share.name] -= share.amount;
        net[item.payer] += share.amount;
      });
    return acc;
  }, {});

  participants.forEach(name => {
    const balance = net[name] || 0;
    const row = document.createElement('div');
    row.className = 'list-item';
    row.innerHTML = `
      <div class="summary-row"><span>${name}</span><strong>${formatCurrency(Math.abs(balance))}</strong></div>
      <p>${balance > 0 ? 'Should receive' : balance < 0 ? 'Still owes' : 'Settled'}</p>
    `;
    balancesList.appendChild(row);
  });

  if (!owesBreakdownElement) return;
  const lines = Object.values(owedByPair).sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
  if (!lines.length) {
    owesBreakdownElement.innerHTML = '<div class="card list-item"><p>No outstanding debts. All shares are settled.</p></div>';
    return;
  }

  lines.forEach(line => {
    const row = document.createElement('div');
    row.className = 'list-item';
    row.innerHTML = `
      <div class="summary-row"><span>${line.from} owes ${line.to}</span><strong>${formatCurrency(line.amount)}</strong></div>
      <p>${line.receiptCount} unpaid receipt${line.receiptCount === 1 ? '' : 's'}</p>
    `;
    owesBreakdownElement.appendChild(row);
  });
}

function addParticipant(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (participants.includes(trimmed)) return;
  participants.push(trimmed);
  saveCurrentTripState();
  renderParticipants();
  renderSummary();
}

function addItineraryItem(item) {
  if (editingItemId) {
    itinerary = itinerary.map(entry => (entry.id === editingItemId ? { ...entry, ...item, id: editingItemId } : entry));
    editingItemId = null;
  } else {
    itinerary.unshift({ id: createId(), ...item });
  }
  saveCurrentTripState();
  renderItinerary();
  itineraryForm.reset();
  autoResizeNotes();
}

function collectReceiptDebts(totalAmount) {
  const splitMode = receiptSplitMode ? receiptSplitMode.value : 'equal';
  const rows = Array.from(document.querySelectorAll('.debt-person-row'));
  const selectedRows = rows.filter(row => {
    const checkbox = row.querySelector('.receipt-debt-checkbox');
    return splitMode === 'custom' || (receiptSplitAll && receiptSplitAll.checked) ? true : checkbox && checkbox.checked;
  });

  if (!selectedRows.length) {
    alert('Select at least one participant who owes this payer.');
    return null;
  }

  if (splitMode === 'custom') {
    const debts = selectedRows.map(row => {
      const checkbox = row.querySelector('.receipt-debt-checkbox');
      const amountInput = row.querySelector('.receipt-debt-amount');
      return {
        name: checkbox.dataset.name,
        amount: Number(amountInput.value || 0),
      };
    });

    if (debts.some(debt => !Number.isFinite(debt.amount) || debt.amount < 0)) {
      alert('Custom amounts can be zero, but cannot be negative.');
      return null;
    }

    const customTotal = debts.reduce((sum, debt) => sum + debt.amount, 0);
    if (customTotal - totalAmount > 0.01) {
      alert(`Custom owed amounts cannot exceed the receipt total of ${formatCurrency(totalAmount)}.`);
      return null;
    }
    const payer = receiptPayer.value;
    const payerShare = Number(Math.max(0, totalAmount - customTotal).toFixed(2));

    return {
      splitMode,
      debts: [
        ...debts.map(debt => ({ ...debt, amount: Number(debt.amount.toFixed(2)) })),
        { name: payer, amount: payerShare },
      ],
    };
  }

  const totalCents = toCents(totalAmount);
  const splitCount = selectedRows.length + 1;
  const baseCents = Math.floor(totalCents / splitCount);
  const remainder = totalCents % splitCount;
  const payer = receiptPayer.value;
  const payerCents = baseCents + (remainder > selectedRows.length ? 1 : 0);
  return {
    splitMode,
    debts: [
      ...selectedRows.map((row, index) => {
        const checkbox = row.querySelector('.receipt-debt-checkbox');
        const cents = baseCents + (index < remainder ? 1 : 0);
        return {
          name: checkbox.dataset.name,
          amount: fromCents(cents),
        };
      }),
      { name: payer, amount: fromCents(payerCents) },
    ],
  };
}

function addReceipt(entry) {
  const payer = entry.payer;
  if (!payer) {
    alert('Please select who paid before saving the receipt.');
    return;
  }
  const split = collectReceiptDebts(entry.amount);
  if (!split) return;
  const debtsByName = split.debts.reduce((acc, debt) => {
    acc[debt.name] = debt.amount;
    return acc;
  }, {});
  const shares = participants.map(name => {
    if (name === payer) {
      const payerAmount = debtsByName[name] || 0;
      return { name, amount: payerAmount, settled: true, status: 'paid', paidAt: null };
    }
    if (debtsByName[name] !== undefined) {
      const amount = debtsByName[name];
      return { name, amount, settled: amount === 0, status: amount === 0 ? 'paid' : 'unpaid', paidAt: null };
    }
    return { name, amount: 0, settled: true, status: 'paid', paidAt: null, excluded: true };
  });
  receipts.unshift({ id: createId(), shares, splitMode: split.splitMode, ...entry });
  saveCurrentTripState();
  renderReceipts();
  renderSummary();
  receiptText.value = '';
  receiptAmount.value = '';
  receiptPayer.value = '';
  if (receiptSplitAll) receiptSplitAll.checked = true;
  if (receiptSplitMode) receiptSplitMode.value = 'equal';
  renderReceiptDebtOptions();
}

function parseReceiptText(text) {
  const amounts = [...text.matchAll(/\b(\d{1,3}(?:[.,]\d{2})?)\b/g)];
  const numbers = amounts.map(match => parseFloat(match[1].replace(',', '.'))).filter(Number.isFinite);
  const amount = numbers.length ? Math.max(...numbers) : 0;
  return amount;
}

function wrapSelection(tagOpen, tagClose) {
  const el = notesTextarea;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const before = el.value.slice(0, start);
  const selected = el.value.slice(start, end);
  const after = el.value.slice(end);
  el.value = `${before}${tagOpen}${selected || 'text'}${tagClose}${after}`;
  el.focus();
  el.selectionStart = start + tagOpen.length;
  el.selectionEnd = end + tagOpen.length;
  autoResizeNotes();
}

function wrapLink() {
  const el = notesTextarea;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const before = el.value.slice(0, start);
  const selected = el.value.slice(start, end) || 'link text';
  const urlInput = prompt('Enter the URL (include http:// or https:// or www.):');
  if (!urlInput) return;
  const url = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;
  const after = el.value.slice(end);
  el.value = `${before}<a href="${url}" target="_blank" rel="noreferrer">${selected}</a>${after}`;
  el.focus();
  el.selectionStart = start;
  el.selectionEnd = start + selected.length;
  autoResizeNotes();
}

function autoResizeNotes() {
  if (!notesTextarea) return;
  notesTextarea.style.height = 'auto';
  notesTextarea.style.height = `${notesTextarea.scrollHeight}px`;
}

function getDateInputValue(value) {
  const parsed = parseHeaderLine(value || '');
  return parsed && parsed.day ? parsed.day : value || '';
}

function parseHeaderLine(header) {
  const currentYear = new Date().getFullYear();
  const headerText = (header || '').trim();
  if (!headerText) return null;

  const normalized = headerText.replace(/\s+/g, ' ').trim();
  const match = normalized.match(/^([0-3]?\d)[-\s]+([A-Za-z]+)(?:[-\s]+(\d{2,4}))?(?:\s*\(([^)]+)\))?(?:\s+(.*))?$/);
  if (!match) return { day: headerText, location: '' };

  const dayNumber = Number(match[1]);
  const monthText = match[2];
  let yearText = match[3];
  const dayLabel = match[4];
  const rest = match[5] ? match[5].trim() : '';
  const monthMap = {
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
    jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec'
  };
  const monthKey = monthText.slice(0, 3).toLowerCase();
  const monthShort = monthMap[monthKey];
  if (!monthShort) return { day: headerText, location: rest };

  if (!yearText) {
    yearText = String(currentYear);
  } else if (yearText.length === 2) {
    yearText = `20${yearText}`;
  }

  const parsedDate = new Date(`${monthShort} ${dayNumber}, ${yearText}`);
  const weekday = parsedDate.toString() !== 'Invalid Date'
    ? parsedDate.toLocaleDateString('en-US', { weekday: 'short' })
    : dayLabel;

  const formattedDay = `${String(dayNumber).padStart(2, '0')}-${monthShort}-${yearText}`;
  const formatted = weekday ? `${formattedDay} (${weekday})` : formattedDay;
  return {
    day: formatted,
    location: rest,
  };
}

function formatNotes(notes) {
  if (!notes) return '<p class="note-placeholder">No notes added.</p>';
  const linked = notes.replace(/(https?:\/\/|www\.)[^\s<]+/g, match => {
    const url = match.startsWith('http') ? match : `https://${match}`;
    return `<a href="${url}" target="_blank" rel="noreferrer">${match}</a>`;
  });
  return linked.replace(/\n/g, '<br />');
}

function normalizeLine(line) {
  return line.replace(/\t/g, ' ').replace(/\s+$/g, '').replace(/^\s+/g, '');
}

function parseItineraryText(text) {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.replace(/\r?$/, ''))
    .map(normalizeLine);

  const items = [];
  let current = null;
  const dayLineRegex = /^\d{1,2}[-\s][A-Za-z]+(?:[-\s]\d{2,4})?(?:\s*\([^\)]+\))?(?:\s+.+)?$/;
  const fieldLineRegex = /^(Base|Activities|Transport|Notes)\s*[:•-]?\s*(.*)$/i;

  lines.forEach(line => {
    if (!line && current) {
      current.lastField = 'notes';
      current.fields.notes = current.fields.notes ? `${current.fields.notes}\n` : '';
      return;
    }

    const dayLine = dayLineRegex.test(line) && !/^Base|Activities|Transport|Notes$/i.test(line);
    if (dayLine) {
      if (current) items.push(current);
      current = { header: line, fields: {}, lastField: null };
      return;
    }

    if (!current) return;

    const fieldMatch = line.match(fieldLineRegex);
    if (fieldMatch) {
      const key = fieldMatch[1].toLowerCase();
      const value = fieldMatch[2].trim();
      current.fields[key] = value;
      current.lastField = key;
      return;
    }

    if (/^[•-]\s*/.test(line)) {
      const value = line.replace(/^[•-]\s*/, '');
      const key = current.lastField || 'activities';
      current.fields[key] = current.fields[key]
        ? `${current.fields[key]}\n• ${value}`
        : `• ${value}`;
      return;
    }

    const key = current.lastField || 'notes';
    current.fields[key] = current.fields[key]
      ? `${current.fields[key]}\n${line}`
      : line;
  });

  if (current) items.push(current);

  return items.map(item => {
    const header = parseHeaderLine(item.header) || { day: item.header, location: '' };
    const day = header.day || item.header;
    const location = header.location || item.fields.base || 'Trip day';
    const notesParts = [];

    ['base', 'activities', 'transport', 'notes'].forEach(key => {
      if (item.fields[key]) {
        notesParts.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${item.fields[key]}`);
      }
    });

    return {
      day,
      time: '',
      location,
      notes: notesParts.join('\n\n'),
    };
  });
}

function extractTextFromPdf(file) {
  return file.arrayBuffer().then(buffer => {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    return loadingTask.promise.then(async pdf => {
      let text = '';
      for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
        const page = await pdf.getPage(pageIndex);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        text += pageText + '\n';
      }
      return text;
    });
  });
}

itineraryForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = {
    day: document.getElementById('item-day').value.trim(),
    time: document.getElementById('item-time').value.trim(),
    location: document.getElementById('item-location').value.trim(),
    notes: document.getElementById('item-notes').value.trim(),
  };
  if (!data.day && !data.time && !data.location && !data.notes) return;
  addItineraryItem(data);
});

addParticipantButton.addEventListener('click', event => {
  event.preventDefault();
  addParticipant(participantName.value);
  participantName.value = '';
});

boldButton.addEventListener('click', () => wrapSelection('<strong>', '</strong>'));
italicButton.addEventListener('click', () => wrapSelection('<em>', '</em>'));
underlineButton.addEventListener('click', () => wrapSelection('<u>', '</u>'));
headingButton.addEventListener('click', () => wrapSelection('<h3>', '</h3>'));
blueButton.addEventListener('click', () => wrapSelection('<span style="color: var(--accent-blue);">', '</span>'));
pinkButton.addEventListener('click', () => wrapSelection('<span style="color: var(--accent-pink);">', '</span>'));
roseButton.addEventListener('click', () => wrapSelection('<span style="color: var(--accent-rose);">', '</span>'));
amberButton.addEventListener('click', () => wrapSelection('<span style="color: var(--accent-amber);">', '</span>'));
greenButton.addEventListener('click', () => wrapSelection('<span style="color: var(--accent-green);">', '</span>'));
goldButton.addEventListener('click', () => wrapSelection('<span style="color: var(--accent-gold);">', '</span>'));
linkButton.addEventListener('click', wrapLink);

participantsList.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const index = Number(button.dataset.index);
  if (Number.isNaN(index)) return;
  participants.splice(index, 1);
  saveCurrentTripState();
  renderParticipants();
  renderSummary();
});

itineraryList.addEventListener('click', event => {
  const editButton = event.target.closest('.edit-btn');
  const deleteButton = event.target.closest('.delete-btn');
  if (editButton) {
    const id = editButton.dataset.id;
    const item = itinerary.find(entry => entry.id === id);
    if (!item) return;
    document.getElementById('item-day').value = getDateInputValue(item.day);
    document.getElementById('item-time').value = item.time;
    document.getElementById('item-location').value = item.location;
    document.getElementById('item-notes').value = item.notes;
    autoResizeNotes();
    itineraryForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    notesTextarea.focus();
    editingItemId = id;
  }
  if (deleteButton) {
    const id = deleteButton.dataset.id;
    itinerary = itinerary.filter(entry => entry.id !== id);
    saveCurrentTripState();
    renderItinerary();
  }
});

notesTextarea.addEventListener('input', autoResizeNotes);

receiptsList.addEventListener('click', event => {
  const deleteButton = event.target.closest('.delete-btn');
  const checkbox = event.target.matches('input.receipt-share-checkbox') ? event.target : event.target.querySelector('input.receipt-share-checkbox');
  if (deleteButton) {
    const id = deleteButton.dataset.id;
    receipts = receipts.filter(entry => entry.id !== id);
    saveCurrentTripState();
    renderReceipts();
    renderSummary();
    return;
  }
  if (checkbox) {
    const id = checkbox.dataset.id;
    const name = checkbox.dataset.name;
    receipts = receipts.map(entry => {
      if (entry.id !== id) return entry;
      return {
        ...entry,
        shares: entry.shares.map(share => (share.name === name
          ? {
              ...share,
              settled: checkbox.checked,
              status: checkbox.checked ? 'paid' : 'unpaid',
              paidAt: checkbox.checked ? new Date().toISOString() : null,
            }
          : share)),
      };
    });
    saveCurrentTripState();
    renderReceipts();
    renderSummary();
  }
});

receiptFile.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.type.startsWith('image/')) {
    alert('Image receipts are stored for reference. Please add the amount and payer manually.');
    return;
  }
  try {
    const text = await file.text();
    receiptText.value = text.trim();
    const parsed = parseReceiptText(text);
    if (parsed) receiptAmount.value = parsed.toFixed(2);
  } catch (error) {
    console.error(error);
  }
});

itineraryFile.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    let text;
    if (file.type === 'application/pdf') {
      text = await extractTextFromPdf(file);
    } else {
      text = await file.text();
    }
    itineraryExtracted.value = text.trim();
  } catch (error) {
    console.error(error);
    alert('Unable to read that itinerary file. Try a text file or a simpler PDF.');
  }
});

receiptPayer.addEventListener('change', () => renderReceiptDebtOptions());
if (receiptSplitAll) {
  receiptSplitAll.addEventListener('change', () => renderReceiptDebtOptions());
}
if (receiptSplitMode) {
  receiptSplitMode.addEventListener('change', () => renderReceiptDebtOptions());
}

tripSelect.addEventListener('change', event => {
  if (!event.target.value) return;
  saveCurrentTripState();
  loadTrip(event.target.value);
});

newTripButton.addEventListener('click', event => {
  event.preventDefault();
  const name = tripNameInput.value.trim() || `Journey ${trips.length + 1}`;
  saveCurrentTripState();
  createNewTrip(name);
});

saveTripButton.addEventListener('click', event => {
  event.preventDefault();
  saveToBackend();
});

deleteTripButton.addEventListener('click', event => {
  event.preventDefault();
  const trip = getCurrentTrip();
  if (!trip) return;
  if (!confirm(`Delete journey "${trip.name}"? This cannot be undone.`)) return;
  trips = trips.filter(item => item.id !== trip.id);
  if (trips.length === 0) {
    createNewTrip('My first journey');
    return;
  }
  currentTripId = trips[0].id;
  saveTrips();
  loadTrip(currentTripId);
});

tripNameInput.addEventListener('blur', saveCurrentTripState);
window.addEventListener('beforeunload', saveCurrentTripState);
if (loadBackendButton) {
  loadBackendButton.addEventListener('click', event => {
    event.preventDefault();
    loadFromBackend();
  });
}
if (saveBackendButton) {
  saveBackendButton.addEventListener('click', event => {
    event.preventDefault();
    saveToBackend();
  });
}
bottomSaveJourneyButton.addEventListener('click', event => {
  event.preventDefault();
  saveToBackend();
});

scrollTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('scroll', updateScrollTopButton);

importItineraryButton.addEventListener('click', event => {
  event.preventDefault();
  const text = itineraryExtracted.value.trim();
  if (!text) {
    alert('Upload an itinerary PDF or paste text before importing.');
    return;
  }
  const items = parseItineraryText(text);
  if (!items.length) {
    alert('No itinerary items could be extracted. Check the uploaded file or edit the text.');
    return;
  }
  items.forEach(item => addItineraryItem(item));
  alert(`${items.length} itinerary item${items.length === 1 ? '' : 's'} imported.`);
});

addReceiptButton.addEventListener('click', event => {
  event.preventDefault();
  if (!participants.length) {
    alert('Add at least one participant before creating receipts.');
    return;
  }
  const amountValue = Number(receiptAmount.value);
  const payerValue = receiptPayer.value;
  if (!payerValue || amountValue <= 0) {
    alert('Choose who paid and enter a valid amount.');
    return;
  }
  addReceipt({
    description: receiptText.value.trim() || 'Receipt entry',
    rawText: receiptText.value.trim(),
    amount: amountValue,
    payer: payerValue,
    createdAt: new Date().toISOString(),
  });
});

ensureDefaultTrip();
autoResizeNotes();
updateScrollTopButton();

const savedSecret = localStorage.getItem('swissTripAppSecret');
if (savedSecret) {
  appSecretInput.value = savedSecret;
  loadFromBackend();
}
