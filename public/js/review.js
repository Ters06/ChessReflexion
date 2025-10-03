// Ce script gère toute la logique de la page de jeu et de révision (review.html).
// Il dépend de main.js pour la création des modales.

document.addEventListener("DOMContentLoaded", async () => {
  // --- GLOBAL VARIABLES FOR THIS PAGE ---
  let gameLogic = new Chess();
  let gameData = null;
  let history = [];
  let currentMoveIndex = 0;

  const gameId = new URLSearchParams(window.location.search).get("id");
  const pieceUnicode = {
    p: "♟︎",
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    P: "♙",
    R: "♖",
    N: "♘",
    B: "♗",
    Q: "♕",
    K: "♔",
  };

  // --- DOM ELEMENTS ---
  const boardElement = document.getElementById("board");
  const statusElement = document.getElementById("game-status");
  const pgnElement = document.getElementById("pgn");
  const moveCounterElement = document.getElementById("move-counter");
  const dojoContainer = document.getElementById("dojo-controls-container");
  const moveInputArea = document.getElementById("move-input-area");
  const gameActionsContainer = document.getElementById("game-actions");

  // --- INITIALIZATION ---
  async function initializePage() {
    if (!gameId) {
      document.body.innerHTML =
        '<h1 class="text-red-500 text-center p-8">Erreur: ID de partie manquant.</h1>';
      return;
    }

    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch(
        `/.netlify/functions/get-game-details?id=${gameId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Impossible de charger la partie."
        );
      }

      gameData = await response.json();

      if (gameData.pgn) gameLogic.load_pgn(gameData.pgn);

      history = gameLogic.history({ verbose: true });
      currentMoveIndex = history.length;

      updateUI();
      setupEventListeners(); // Now it's safe to call this
    } catch (error) {
      console.error("Erreur d'initialisation:", error);
      document.getElementById(
        "game-view"
      ).innerHTML = `<p class="text-red-400 text-center p-8">${error.message}</p>`;
    }
  }

  // --- UI UPDATE FUNCTIONS ---
  function renderBoard(fen) {
    boardElement.innerHTML = "";
    const tempGame = new Chess(fen);
    const boardArray = tempGame.board();
    const rows =
      gameData.played_as === "w" ? boardArray : [...boardArray].reverse();

    for (let i = 0; i < 8; i++) {
      const row = gameData.played_as === "w" ? rows[i] : [...rows[i]].reverse();
      for (let j = 0; j < 8; j++) {
        const squareDiv = document.createElement("div");
        const isLight = (i + j) % 2 !== 0;
        squareDiv.className = `square ${isLight ? "light" : "dark"}`;
        const piece = row[j];
        if (piece) {
          squareDiv.textContent = pieceUnicode[piece.type];
          squareDiv.classList.add(
            piece.color === "w" ? "piece-white" : "piece-black"
          );
        }
        boardElement.appendChild(squareDiv);
      }
    }
  }

  function updateUI() {
    const tempGame = new Chess();
    for (let i = 0; i < currentMoveIndex; i++) {
      tempGame.move(history[i].san);
    }

    renderBoard(tempGame.fen());
    updateStatus(tempGame);
    updateNavigation();
    updateDojoAndMoveInput(tempGame);
    loadReflectionData(currentMoveIndex);
  }

  function updateStatus(currentGame) {
    let status = "";
    const moveColor = currentGame.turn() === "b" ? "Noirs" : "Blancs";

    if (gameData.status === "completed") {
      status = `Partie terminée. Résultat: ${gameData.result} (${
        gameData.termination || "inconnu"
      })`;
    } else if (currentGame.game_over()) {
      status = "FIN DE PARTIE";
      if (currentGame.in_checkmate()) {
        gameData.status = "completed";
        gameData.result = currentGame.turn() === "b" ? "1-0" : "0-1";
        gameData.termination = "checkmate";
        saveGameState();
      } else if (currentGame.in_stalemate() || currentGame.in_draw()) {
        gameData.status = "completed";
        gameData.result = "1/2-1/2";
        gameData.termination = "draw";
        saveGameState();
      }
    } else {
      status = `Trait aux ${moveColor}`;
      if (currentGame.in_check()) {
        status += ", en échec.";
      }
    }
    statusElement.textContent = status;
    pgnElement.innerHTML = gameLogic.pgn({
      max_width: 5,
      newline_char: "<br />",
    });
  }

  function updateNavigation() {
    moveCounterElement.textContent = `Coup ${
      Math.floor(currentMoveIndex / 2) + (currentMoveIndex % 2)
    } / ${Math.ceil(history.length / 2)}`;
    document.getElementById("nav-start").disabled = currentMoveIndex === 0;
    document.getElementById("nav-prev").disabled = currentMoveIndex === 0;
    document.getElementById("nav-next").disabled =
      currentMoveIndex === history.length;
    document.getElementById("nav-end").disabled =
      currentMoveIndex === history.length;
  }

  function updateDojoAndMoveInput(currentGame) {
    const isPlayerTurn = currentGame.turn() === gameData.played_as;

    dojoContainer.innerHTML = `
            <button id="analyse-button" class="w-full font-semibold py-3 px-4 rounded-lg transition">
                Analyser avec le Dojo
            </button>
        `;
    const dojoButton = document.getElementById("analyse-button");
    if (isPlayerTurn && !currentGame.game_over()) {
      dojoButton.className +=
        " bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/40";
      dojoButton.disabled = false;
      dojoButton.onclick = () => openModal("modal-step1");
    } else {
      dojoButton.className +=
        " bg-slate-700/50 text-slate-400 cursor-not-allowed";
      dojoButton.disabled = true;
    }

    moveInputArea.style.display =
      currentMoveIndex === history.length &&
      gameData.status === "in_progress" &&
      !currentGame.game_over()
        ? "block"
        : "none";

    gameActionsContainer.innerHTML = "";
    if (gameData.status === "in_progress" && !currentGame.game_over()) {
      gameActionsContainer.innerHTML = `
                <button id="resign-btn" class="bg-orange-500/20 text-orange-300 text-sm font-semibold py-2 px-3 rounded-lg hover:bg-orange-500/40 transition">Abandon</button>
                <button id="draw-btn" class="bg-sky-500/20 text-sky-300 text-sm font-semibold py-2 px-3 rounded-lg hover:bg-sky-500/40 transition">Nulle</button>
            `;
      document.getElementById("resign-btn").onclick = () =>
        declareResult("resign");
      document.getElementById("draw-btn").onclick = () =>
        declareResult("draw_agreed");
    }
  }

  // --- NAVIGATION & GAME ACTIONS ---
  function navigateTo(index) {
    currentMoveIndex = Math.max(0, Math.min(index, history.length));
    updateUI();
  }

  async function saveGameState() {
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("/.netlify/functions/update-game", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameId: gameId,
          pgn: gameLogic.pgn(),
          status: gameData.status,
          result: gameData.result,
          termination: gameData.termination,
        }),
      });
      if (!response.ok) throw new Error("La sauvegarde de la partie a échoué.");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert(error.message);
    }
  }

  async function handleNewMove(moveSan) {
    if (gameLogic.move(moveSan, { sloppy: true })) {
      history = gameLogic.history({ verbose: true });
      currentMoveIndex = history.length;
      await saveGameState();
      updateUI();
    } else {
      alert(
        "Coup invalide. Utilisez la notation SAN (ex: e4, Cf3, O-O, Fxc6)."
      );
    }
  }

  async function declareResult(terminationType) {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir déclarer cette partie terminée par ${
          terminationType === "resign" ? "abandon" : "nulle"
        } ?`
      )
    )
      return;

    gameData.status = "completed";
    gameData.termination = terminationType;
    if (terminationType === "resign") {
      gameData.result = gameData.played_as === "w" ? "0-1" : "1-0";
    } else {
      gameData.result = "1/2-1/2";
    }
    await saveGameState();
    updateUI();
  }

  // --- REFLECTION LOGIC ---
  function loadReflectionData(plyNumber) {
    if (!gameData || !gameData.reflections) return;
    const reflection = gameData.reflections.find(
      (r) => r.ply_number === plyNumber
    );
    document.getElementById("reflection-step1").value =
      reflection?.reflection_step1 || "";
    document.getElementById("reflection-step2").value =
      reflection?.reflection_step2 || "";
    document.getElementById("reflection-step3").value =
      reflection?.reflection_step3 || "";
  }

  async function saveReflection() {
    // The reflection is for the position *before* the current move is made.
    // The ply number is the number of half-moves played.
    const plyNumber = currentMoveIndex;

    const reflectionData = {
      gameId: gameId,
      plyNumber: plyNumber,
      reflection_step1: document.getElementById("reflection-step1").value,
      reflection_step2: document.getElementById("reflection-step2").value,
      reflection_step3: document.getElementById("reflection-step3").value,
    };

    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch("/.netlify/functions/save-reflection", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reflectionData),
      });
      if (!response.ok)
        throw new Error("La sauvegarde de la réflexion a échoué.");

      if (!gameData.reflections) gameData.reflections = [];
      const existingReflection = gameData.reflections.find(
        (r) => r.ply_number === plyNumber
      );
      if (existingReflection) {
        Object.assign(existingReflection, reflectionData);
      } else {
        gameData.reflections.push(reflectionData);
      }
      alert("Analyse sauvegardée !");
      closeModal("modal-step3");
    } catch (error) {
      console.error("Erreur:", error);
      alert(error.message);
    }
  }

  // --- EVENT LISTENERS & INITIALIZATION ---
  function setupEventListeners() {
    // Navigation
    document
      .getElementById("nav-start")
      .addEventListener("click", () => navigateTo(0));
    document
      .getElementById("nav-prev")
      .addEventListener("click", () => navigateTo(currentMoveIndex - 1));
    document
      .getElementById("nav-next")
      .addEventListener("click", () => navigateTo(currentMoveIndex + 1));
    document
      .getElementById("nav-end")
      .addEventListener("click", () => navigateTo(history.length));

    // Move input
    const moveInput = document.getElementById("move-input");
    const submitMoveBtn = document.getElementById("submit-move");

    if (submitMoveBtn) {
      submitMoveBtn.addEventListener("click", () => {
        if (moveInput.value) handleNewMove(moveInput.value);
      });
    }
    if (moveInput) {
      moveInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && moveInput.value)
          handleNewMove(moveInput.value);
      });
    }

    // This button is specific to this page's logic
    const saveReflectionBtn = document.getElementById("save-reflection");
    if (saveReflectionBtn) {
      saveReflectionBtn.addEventListener("click", saveReflection);
    }
  }

  // --- START THE PAGE ---
  initializePage();
});
