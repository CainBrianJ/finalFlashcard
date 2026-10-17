(() => {
  const DATA = window.ITALIAN_DATA;
  const params = new URLSearchParams(location.search);
  const category = document.body.dataset.category || params.get("category") || "";
  const title = document.getElementById("pageTitle");
  const subtitle = document.getElementById("pageSubtitle");
  const verbSelect = document.getElementById("verbSelect");
  const englishCards = document.getElementById("englishCards");
  const italianCards = document.getElementById("italianCards");
  const roundEl = document.getElementById("round");
  const matchedEl = document.getElementById("matched");
  const scoreEl = document.getElementById("score");
  const progress = document.getElementById("progressBar");
  const message = document.getElementById("message");
  const complete = document.getElementById("complete");

  let available = [];
  let currentRound = [];
  let selectedItalian = null;
  let matched = 0;
  let score = 0;
  let round = 1;
  let locked = false;

  const categoryNames = {
    are: "-ARE Verbs",
    ere: "-ERE Verbs",
    ire: "-IRE Verbs",
    reflexive: "Reflexive Verbs",
    irregular: "Irregular Verbs"
  };

  const categoryDescriptions = {
    are: "Practice the five -are verbs together.",
    ere: "Practice the five -ere verbs together.",
    ire: "Practice the five -ire verbs together.",
    reflexive: "Practice the five reflexive verbs together.",
    irregular: "Practice the five high-frequency irregular verbs together."
  };

  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeAvailable() {
    const verbs = DATA.categories[category] || [];
    available = verbs.flatMap(v => DATA.verbs[v].cards.map((pair, idx) => ({
      id: `${v}-${idx}`,
      verb: v,
      italian: pair[0],
      english: pair[1]
    })));
  }

  function makeRound() {
    const chosenVerb = verbSelect.value;
    const pool = chosenVerb === "all"
      ? available
      : available.filter(x => x.verb === chosenVerb);
    currentRound = shuffle(pool).slice(0, Math.min(10, pool.length));
    matched = 0;
    selectedItalian = null;
    locked = false;
    matchedEl.textContent = "0";
    complete.innerHTML = "";
    message.textContent = "Select an Italian card, then select its English match.";
    render();
  }

  function render() {
    englishCards.innerHTML = "";
    italianCards.innerHTML = "";

    // Italian is deliberately on the LEFT.
    shuffle(currentRound).forEach(item => {
      italianCards.appendChild(card(item.italian, "italian", item.id, item.verb));
    });
    shuffle(currentRound).forEach(item => {
      englishCards.appendChild(card(item.english, "english", item.id, item.verb));
    });
    updateProgress();
  }

  function card(text, side, id, verb) {
    const b = document.createElement("button");
    b.className = "card";
    b.type = "button";
    b.dataset.id = id;
    b.dataset.side = side;
    b.title = verb;
    b.innerHTML = `<span>${escapeHtml(text)}</span><small>${escapeHtml(verb)}</small>`;
    b.addEventListener("click", () => choose(b));
    return b;
  }

  function choose(card) {
    if (locked || card.classList.contains("matched")) return;

    if (card.dataset.side === "italian") {
      document.querySelectorAll('.card[data-side="italian"]').forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedItalian = card;
      message.textContent = "Now choose the English meaning.";
      return;
    }

    if (!selectedItalian) {
      message.textContent = "Choose an Italian card first.";
      return;
    }

    locked = true;
    if (card.dataset.id === selectedItalian.dataset.id) {
      card.classList.add("correct");
      selectedItalian.classList.add("correct");
      score++;
      matched++;
      scoreEl.textContent = score;
      matchedEl.textContent = matched;
      message.textContent = "Correct!";
      setTimeout(() => {
        card.classList.add("matched");
        selectedItalian.classList.add("matched");
        selectedItalian.classList.remove("selected");

        // Keep matched pairs visible at the top, side-by-side with their translation.
        // Insert each new pair immediately after the previously matched pairs so
        // matches accumulate from top to bottom in the order they were found.
        const firstUnmatchedItalian = italianCards.querySelector('.card:not(.matched)');
        const firstUnmatchedEnglish = englishCards.querySelector('.card:not(.matched)');
        if (firstUnmatchedItalian) {
          italianCards.insertBefore(selectedItalian, firstUnmatchedItalian);
        } else {
          italianCards.appendChild(selectedItalian);
        }
        if (firstUnmatchedEnglish) {
          englishCards.insertBefore(card, firstUnmatchedEnglish);
        } else {
          englishCards.appendChild(card);
        }

        selectedItalian = null;
        locked = false;
        updateProgress();
        if (matched === currentRound.length) finish();
      }, 220);
    } else {
      card.classList.add("wrong");
      selectedItalian.classList.add("wrong");
      message.textContent = "Not a match — try again.";
      setTimeout(() => {
        card.classList.remove("wrong");
        selectedItalian.classList.remove("wrong", "selected");
        locked = false;
      }, 380);
    }
  }

  function finish() {
    message.textContent = "Round complete!";
    complete.innerHTML =
      `<div class="complete"><strong>Round ${round} complete!</strong><br>
       You matched all ${currentRound.length} cards.
       <br><br><button class="primary" id="nextRound">Next Round</button></div>`;
    document.getElementById("nextRound").addEventListener("click", () => {
      round++;
      roundEl.textContent = round;
      makeRound();
    });
  }

  function updateProgress() {
    progress.style.width = `${(matched / Math.max(currentRound.length, 1)) * 100}%`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function init() {
    if (!category || !DATA.categories[category]) return;
    title.textContent = categoryNames[category];
    subtitle.textContent = categoryDescriptions[category];

    verbSelect.innerHTML = `<option value="all">All ${DATA.categories[category].length} verbs</option>`;
    DATA.categories[category].forEach(v => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = `${v} — ${DATA.verbs[v].meaning}`;
      verbSelect.appendChild(o);
    });

    makeAvailable();
    makeRound();

    document.getElementById("newRound").addEventListener("click", () => {
      round++;
      roundEl.textContent = round;
      makeRound();
    });
    document.getElementById("shuffle").addEventListener("click", makeRound);
    verbSelect.addEventListener("change", makeRound);
    setupTenseModal();
  }

  function setupTenseModal(){
    const select=document.getElementById("tenseSelect"), modal=document.getElementById("tenseModal");
    if(!select||!modal)return;
    const close=()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true");select.focus()};
    select.addEventListener("change",()=>{const info=window.ITALIAN_TENSES[select.value];if(!info)return;document.getElementById("tenseModalTitle").textContent=info[0];document.getElementById("tenseDefinition").textContent=info[1];document.getElementById("tenseExamples").innerHTML=info[2].map(x=>`<div class="tense-example"><div class="italian">${escapeHtml(x[0])}</div><div class="translation">${escapeHtml(x[1])}</div></div>`).join("");modal.classList.add("open");modal.setAttribute("aria-hidden","false");select.value="";document.getElementById("tenseClose").focus()});
    document.getElementById("tenseClose").addEventListener("click",close);document.getElementById("tenseBackdrop").addEventListener("click",close);document.addEventListener("keydown",e=>{if(e.key==="Escape"&&modal.classList.contains("open"))close()});
  }

  init();
})();