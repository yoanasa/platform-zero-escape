const clueOrder = ['clock', 'music', 'case'];
const objects = {
  clock: { title: 'The brass clock', number: '4', icon: '◷', copy: 'It ticks like it has all the time in the world. A small brass plate under the face reads ROOM 4.' },
  music: { title: 'The music box', number: '1', icon: '✦', copy: 'A half-finished tune hides under the lid. There’s a maker’s mark on the side: ROOM 1.' },
  case: { title: 'The suitcase', number: '6', icon: '▰', copy: 'The leather is scuffed from a lot of journeys. A paper tag is still tied to the handle: ROOM 6.' }
};
const hints = [
  'Each object has a small room number. You need three numbers for the door.',
  'The note gives you an order: something that keeps time, makes a tune, then travels.',
  'Try the brass clock, then the music box, then the suitcase.'
];
const solution = '416';
const duration = 90;
const dialog = document.querySelector('#game-dialog');
const cover = document.querySelector('#start-cover');
const timerValue = document.querySelector('#timer-value');
const timerBadge = document.querySelector('.timer');
const slots = [...document.querySelectorAll('#code-slots li')];
const caseFeedback = document.querySelector('#case-feedback');
const hintButton = document.querySelector('#hint-button');
const hintCount = document.querySelector('#hint-count');
const takeButton = document.querySelector('#take-number');
const codeInput = document.querySelector('#code-input');
let remaining = duration;
let timerId = null;
let collected = [];
let hintIndex = 0;
let activeObject = null;
let playing = false;
let finished = false;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
}

function updateTimer() {
  timerValue.textContent = formatTime(remaining);
  timerBadge.classList.toggle('is-urgent', remaining <= 15 && playing);
}

function stopTimer() {
  if (timerId) window.clearInterval(timerId);
  timerId = null;
  playing = false;
  updateTimer();
}

function resetState() {
  stopTimer();
  remaining = duration;
  collected = [];
  hintIndex = 0;
  activeObject = null;
  finished = false;
  hintCount.textContent = '3 LEFT';
  caseFeedback.textContent = 'Start the clock, then inspect the objects in the note’s order.';
  slots.forEach(slot => { slot.textContent = '—'; slot.classList.remove('found'); });
  document.querySelector('#progress-label').textContent = '0 / 3 FOUND';
  document.querySelector('#code-feedback').textContent = '';
  codeInput.value = '';
  takeButton.disabled = false;
  takeButton.innerHTML = 'Add this number <span aria-hidden="true">↗</span>';
  updateTimer();
}

function beginGame() {
  if (timerId) window.clearInterval(timerId);
  resetState();
  playing = true;
  cover.hidden = true;
  timerId = window.setInterval(() => {
    remaining -= 1;
    updateTimer();
    if (remaining <= 0) showTimeout();
  }, 1000);
}

function restartGame() {
  if (dialog.open) dialog.close();
  cover.hidden = false;
  resetState();
}

function showPanel(panelId) {
  document.querySelectorAll('.dialog-panel').forEach(panel => { panel.hidden = panel.id !== panelId; });
}

function openObject(objectId) {
  if (!playing || finished) return;
  const item = objects[objectId];
  if (!item) return;
  activeObject = objectId;
  showPanel('object-panel');
  document.querySelector('#object-icon').textContent = item.icon;
  document.querySelector('#dialog-title').textContent = item.title;
  document.querySelector('#object-copy').textContent = item.copy;
  document.querySelector('#object-number').textContent = item.number;
  const feedback = document.querySelector('#dialog-feedback');
  feedback.textContent = collected.includes(objectId) ? 'You already added this room number.' : '';
  takeButton.disabled = collected.includes(objectId);
  takeButton.innerHTML = collected.includes(objectId) ? 'Number collected ✓' : 'Add this number <span aria-hidden="true">↗</span>';
  dialog.showModal();
}

document.querySelectorAll('.hotspot[data-object]').forEach(button => {
  button.addEventListener('click', () => openObject(button.dataset.object));
});

document.querySelectorAll('.dialog-close').forEach(button => {
  button.addEventListener('click', () => dialog.close());
});

dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});

takeButton.addEventListener('click', () => {
  if (!activeObject || !playing || collected.includes(activeObject)) return;
  const expectedObject = clueOrder[collected.length];
  const feedback = document.querySelector('#dialog-feedback');
  if (activeObject !== expectedObject) {
    feedback.textContent = 'Not quite. Follow the conductor’s note: time, tune, journey.';
    return;
  }
  const item = objects[activeObject];
  collected.push(activeObject);
  const slot = slots[collected.length - 1];
  slot.textContent = item.number;
  slot.classList.add('found');
  document.querySelector('#progress-label').textContent = `${collected.length} / 3 FOUND`;
  feedback.textContent = `Room ${item.number} added to the sequence.`;
  takeButton.disabled = true;
  takeButton.innerHTML = 'Number collected ✓';
  if (collected.length === 3) {
    caseFeedback.textContent = 'The sequence is complete. Try the exit door.';
    document.querySelector('#dialog-feedback').textContent = 'All three room numbers are in order. The door is ready.';
  } else {
    const nextVerb = ['keep time', 'find a tune', 'take the journey'][collected.length];
    caseFeedback.textContent = `${collected.length} of 3 found. Next: ${nextVerb}.`;
  }
});

document.querySelector('#door-button').addEventListener('click', () => {
  if (!playing || finished) return;
  if (collected.length < 3) {
    caseFeedback.textContent = 'The door keypad needs all three room numbers first.';
    return;
  }
  showPanel('keypad-panel');
  codeInput.value = '';
  document.querySelector('#code-feedback').textContent = '';
  dialog.showModal();
  codeInput.focus();
});

document.querySelector('#keypad-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!playing || finished) return;
  const guess = codeInput.value.trim();
  if (!/^\d{3}$/.test(guess)) {
    document.querySelector('#code-feedback').textContent = 'Enter three numbers to try the door.';
    return;
  }
  if (guess !== solution) {
    document.querySelector('#code-feedback').textContent = 'No click. Reread the conductor’s note and check the order.';
    codeInput.select();
    return;
  }
  showWin();
});

document.querySelector('#start-button').addEventListener('click', beginGame);
document.querySelector('#restart-button').addEventListener('click', restartGame);
document.querySelector('#restart-text').addEventListener('click', restartGame);
document.querySelector('#play-again').addEventListener('click', restartGame);
document.querySelector('#try-again').addEventListener('click', restartGame);

hintButton.addEventListener('click', () => {
  if (!playing) {
    caseFeedback.textContent = 'Start the clock first. The conductor’s hints will be here.';
    return;
  }
  if (hintIndex >= hints.length) {
    caseFeedback.textContent = 'That’s all the hints. You can do this, traveller.';
    return;
  }
  caseFeedback.textContent = hints[hintIndex];
  hintIndex += 1;
  hintCount.textContent = `${hints.length - hintIndex} LEFT`;
});

function showWin() {
  finished = true;
  stopTimer();
  showPanel('ending-panel');
  const spare = remaining;
  document.querySelector('#ending-copy').textContent = spare > 0
    ? `The door swings open onto a quiet platform beneath an enormous sky. You made it with ${formatTime(spare)} to spare.`
    : 'The door swings open onto a quiet platform beneath an enormous sky. You made it just in time.';
  dialog.showModal();
}

function showTimeout() {
  if (!playing || finished) return;
  remaining = 0;
  stopTimer();
  showPanel('timeout-panel');
  dialog.showModal();
}

updateTimer();
