const QUESTION_COUNT = 18;
const WORKING_TIME_MS = 2 * 60 * 60 * 1000;
const PAUSE_TIME_MS = 5 * 60 * 1000;
const MAX_PAUSES = 3;
const STORAGE_KEY = "limimake-ftl1-draft";

function readSavedDraft() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
        return null;
    }
}

function randomFourDigitNumber() {
    return Math.floor(1000 + Math.random() * 9000);
}

function getInitials(firstName, lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

const savedDraft = readSavedDraft();
const TEST_NUMBER = Number.isInteger(savedDraft?.testNumber) ? savedDraft.testNumber : randomFourDigitNumber();
const TEST_ID = `LV1FT${TEST_NUMBER}`;

// There is intentionally no answer key here. Every answer is reviewed by a human.
const parts = [
    {
        title: "PART 1 - MULTIPLE CHOICE",
        questions: [
            {
                type: "single",
                prompt: "Where is the Green Flag?",
                choices: ["Stage", "Toolbar", "Stories manager", "Bowl of soup"]
            },
            {
                type: "single",
                prompt: "What is a ScratchJr time unit?",
                choices: ["A humoungus skyscraper", "Two seconds", "A tenth of a second", "2,048 1,024ths of a sceond"]
            },
            {
                type: "single",
                prompt: "What color is the Control category?",
                choices: ["Orange", "Blue", "Yellow", "78%"]
            },
            {
                type: "single",
                prompt: "What was ScratchJr made to simplify?",
                choices: ["If you pass, it's what THAT's called", "I forgot what this choice was", "Cat++", "Scratch"]
            },
            {
                type: "single",
                prompt: "What does the Move Up block do?",
                choices: ["Put the character in a rocket", "Move the character up to the top of the two-dimensional stage", "Question 1: Where is the green flag?", "Shrinks the character as if it is moving away from you"]
            }
        ]
    },
    {
        title: "PART 2 - MULTIPLE SELECT",
        questions: [
            {
                type: "multi",
                prompt: "Which are actual ScratchJr categories?",
                choices: ["Sensing", "Math", "Control", "Events"]
            },
            {
                type: "multi",
                prompt: "Which blocks can start a script?",
                choices: ["Green Flag", "Wait", "Start on Tap", "Go Home"]
            },
            {
                type: "multi",
                prompt: "Which blocks are in the Control category?",
                choices: ["Wait", "Move Right", "Repeat", "Say"]
            },
            {
                type: "multi",
                prompt: "What are areas of the ScratchJr interface?",
                choices: ["Stage", "Sounds tab", "Character List", "Toolbar"]
            }
        ]
    },
    {
        title: "PART 3 - TEXT ANSWER",
        questions: [
            { type: "text", prompt: "Where is the Go Home button?" },
            { type: "text", prompt: "Where do you click to change a character’s name?" },
            { type: "text", prompt: "Explain what the Stories Manager is." }
        ]
    },
    {
        title: "PART 4 - TRUE/FALSE",
        questions: [
            { type: "boolean", prompt: "The Wait block measures time in tenths of a second.", choices: ["True", "False"] },
            { type: "boolean", prompt: "The Events category is orange.", choices: ["True", "False"] },
            { type: "boolean", prompt: "The Green Flag is the only way a ScratchJr script can start.", choices: ["True", "False"] },
            { type: "boolean", prompt: "A Stop block pauses the program and then continues automatically.", choices: ["True", "False"] },
            { type: "boolean", prompt: "A character can have more than one script.", choices: ["True", "False"] },
            { type: "boolean", prompt: "The Go Home block sends a character to the first page of the project.", choices: ["True", "False"] }
        ]
    }
];

const state = {
    screen: "welcome",
    testNumber: TEST_NUMBER,
    testId: TEST_ID,
    firstName: "",
    lastName: "",
    testerInitials: "",
    part: 0,
    answers: Array.from({ length: QUESTION_COUNT }, () => null),
    backgroundColor: "#ffffff",
    buttonColor: "#d9d9d9",
    startedAt: null,
    workingRemainingMs: WORKING_TIME_MS,
    lastTickAt: null,
    pauseCount: 0,
    pauseStartedAt: null,
    submitted: false
};

const welcomeScreen = document.getElementById("welcome-screen");
const themeScreen = document.getElementById("theme-screen");
const partScreen = document.getElementById("part-screen");
const questionsScreen = document.getElementById("questions-screen");
const projectScreen = document.getElementById("project-screen");
const thanksScreen = document.getElementById("thanks-screen");
const partTitle = document.getElementById("part-title");
const questionRows = document.getElementById("question-rows");
const pauseOverlay = document.getElementById("pause-overlay");
const pauseCountText = document.getElementById("pause-count");
const pauseTimerText = document.getElementById("pause-timer");
const breakButton = document.getElementById("break-button");

document.getElementById("test-number").textContent = TEST_NUMBER;
document.getElementById("tester-id").textContent = `${TEST_NUMBER}-__`;

let workingTimer = null;
let pauseTimer = null;

document.getElementById("start-button").addEventListener("click", () => {
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();

    if (!firstName || !lastName) {
        document.getElementById("first-name").reportValidity();
        document.getElementById("last-name").reportValidity();
        return;
    }

    state.firstName = firstName;
    state.lastName = lastName;
    state.testerInitials = getInitials(firstName, lastName);
    document.getElementById("tester-id").textContent = `${TEST_NUMBER}-${state.testerInitials}`;
    saveDraft();
    showScreen("theme");
});

document.getElementById("theme-start-button").addEventListener("click", beginTest);
document.getElementById("part-next-button").addEventListener("click", showQuestions);
document.getElementById("questions-next-button").addEventListener("click", nextPart);
document.getElementById("submit-button").addEventListener("click", submitTest);
document.getElementById("resume-button").addEventListener("click", resumeTest);
breakButton.addEventListener("click", pauseTest);

document.getElementById("background-color").addEventListener("input", event => {
    state.backgroundColor = event.target.value;
    applyTheme();
    saveDraft();
});

document.getElementById("button-color").addEventListener("input", event => {
    state.buttonColor = event.target.value;
    applyTheme();
    saveDraft();
});

// The wireframe has no extra pause control. P pauses and Escape resumes.
document.addEventListener("keydown", event => {
    if (event.key.toLowerCase() === "p") pauseTest();
    if (event.key === "Escape") resumeTest();
});

restoreDraft();

function beginTest() {
    state.startedAt = Date.now();
    state.lastTickAt = Date.now();
    state.workingRemainingMs = WORKING_TIME_MS;
    state.pauseCount = 0;
    state.pauseStartedAt = null;
    state.part = 0;
    state.screen = "part";
    state.submitted = false;
    applyTheme();
    saveDraft();
    startWorkingTimer();
    showScreen("part");
    partTitle.textContent = parts[state.part].title;
}

function showScreen(name) {
    const screens = {
        welcome: welcomeScreen,
        theme: themeScreen,
        part: partScreen,
        questions: questionsScreen,
        project: projectScreen,
        thanks: thanksScreen
    };

    Object.values(screens).forEach(screen => { screen.hidden = true; });
    screens[name].hidden = false;
    state.screen = name;
    breakButton.hidden = name !== "part" && name !== "questions";
    breakButton.disabled = state.pauseCount >= MAX_PAUSES || state.submitted;
}

function showQuestions() {
    state.screen = "questions";
    renderPart();
    showScreen("questions");
    saveDraft();
}

function nextPart() {
    if (state.part < parts.length - 1) {
        state.part += 1;
        partTitle.textContent = parts[state.part].title;
        showScreen("part");
        saveDraft();
        return;
    }

    showScreen("project");
    saveDraft();
}

function renderPart() {
    questionRows.innerHTML = "";

    parts[state.part].questions.forEach((question, localIndex) => {
        const questionIndex = questionNumber(state.part, localIndex);
        const row = document.createElement("div");
        row.className = "question-row";

        const prompt = document.createElement("div");
        prompt.className = "question-prompt";
        prompt.textContent = question.prompt;

        const answer = document.createElement("div");
        answer.className = "question-answer";

        if (question.type === "text") {
            renderTextAnswer(answer, questionIndex);
        } else {
            renderChoices(answer, question, questionIndex);
        }

        row.append(prompt, answer);
        questionRows.appendChild(row);
    });

    document.querySelectorAll("#question-rows input, #question-rows textarea").forEach(input => {
        input.addEventListener("input", saveCurrentAnswers);
        input.addEventListener("change", saveCurrentAnswers);
    });
}

function renderChoices(container, question, questionIndex) {
    const list = document.createElement("div");
    list.className = `choice-list${question.type === "boolean" ? " vertical" : ""}`;

    const saved = state.answers[questionIndex];
    const inputType = question.type === "multi" ? "checkbox" : "radio";

    question.choices.forEach((choice, choiceIndex) => {
        const label = document.createElement("label");
        label.className = "choice-label";

        const input = document.createElement("input");
        input.type = inputType;
        input.name = `question-${questionIndex}`;
        input.value = String(choiceIndex);
        input.checked = question.type === "multi"
            ? Array.isArray(saved) && saved.includes(choiceIndex)
            : saved === choiceIndex;

        const text = document.createElement("span");
        text.textContent = choice;
        label.append(input, text);
        list.appendChild(label);
    });

    container.appendChild(list);
}

function renderTextAnswer(container, questionIndex) {
    const input = document.createElement("textarea");
    input.className = "text-answer";
    input.value = typeof state.answers[questionIndex] === "string" ? state.answers[questionIndex] : "";
    input.setAttribute("aria-label", `Answer ${questionIndex + 1}`);
    container.appendChild(input);
}

function saveCurrentAnswers() {
    if (questionsScreen.hidden) return;

    const questions = parts[state.part].questions;

    questions.forEach((question, localIndex) => {
        const questionIndex = questionNumber(state.part, localIndex);
        const row = questionRows.children[localIndex];

        if (question.type === "text") {
            state.answers[questionIndex] = row.querySelector("textarea").value;
        } else if (question.type === "multi") {
            state.answers[questionIndex] = Array.from(row.querySelectorAll("input:checked"), input => Number(input.value));
        } else {
            const checked = row.querySelector("input:checked");
            state.answers[questionIndex] = checked ? Number(checked.value) : null;
        }
    });

    saveDraft();
}

function questionNumber(partIndex, localIndex) {
    return parts.slice(0, partIndex).reduce((total, part) => total + part.questions.length, 0) + localIndex;
}

function startWorkingTimer() {
    clearInterval(workingTimer);
    workingTimer = setInterval(() => {
        if (state.pauseStartedAt || state.submitted) return;

        const now = Date.now();
        state.workingRemainingMs -= now - state.lastTickAt;
        state.lastTickAt = now;

        if (state.workingRemainingMs <= 0) {
            state.workingRemainingMs = 0;
            submitTest();
            return;
        }

        document.title = `${formatTime(state.workingRemainingMs)} - Level 1 Final Test`;
        saveDraft();
    }, 1000);
}

function pauseTest() {
    if (state.screen === "welcome" || state.screen === "theme" || state.screen === "thanks" || state.submitted) return;
    if (state.pauseCount >= MAX_PAUSES || state.pauseStartedAt) return;

    saveCurrentAnswers();
    state.pauseCount += 1;
    state.pauseStartedAt = Date.now();
    pauseCountText.textContent = `Break ${state.pauseCount} of ${MAX_PAUSES}`;
    pauseOverlay.hidden = false;
    breakButton.disabled = true;
    updatePauseTimer();
    pauseTimer = setInterval(updatePauseTimer, 1000);
    saveDraft();
}

function updatePauseTimer() {
    const remaining = Math.max(0, PAUSE_TIME_MS - (Date.now() - state.pauseStartedAt));
    pauseTimerText.textContent = formatTime(remaining).slice(3);
    if (remaining === 0) resumeTest();
}

function resumeTest() {
    if (!state.pauseStartedAt) return;
    state.pauseStartedAt = null;
    state.lastTickAt = Date.now();
    clearInterval(pauseTimer);
    pauseOverlay.hidden = true;
    breakButton.disabled = state.pauseCount >= MAX_PAUSES || state.submitted;
    saveDraft();
}

function submitTest() {
    saveCurrentAnswers();
    state.submitted = true;
    state.pauseStartedAt = null;
    clearInterval(workingTimer);
    clearInterval(pauseTimer);
    state.screen = "thanks";
    saveDraft();
    showScreen("thanks");
}

function applyTheme() {
    document.documentElement.style.setProperty("--button-color", state.buttonColor);
    document.body.style.backgroundColor = state.backgroundColor;
    document.querySelectorAll(".screen").forEach(screen => {
        screen.style.backgroundColor = state.backgroundColor;
    });

    const background = document.getElementById("background-color");
    const buttons = document.getElementById("button-color");
    if (background) background.value = state.backgroundColor;
    if (buttons) buttons.value = state.buttonColor;
}

function saveDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
}

function restoreDraft() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const restored = JSON.parse(saved);
        Object.assign(state, restored);
        applyTheme();

        if (state.submitted) {
            showScreen("thanks");
            return;
        }

        if (state.startedAt) {
            state.lastTickAt = Date.now();
            startWorkingTimer();
            if (state.screen === "questions") renderPart();
            if (state.screen === "part") partTitle.textContent = parts[state.part].title;
            showScreen(state.screen);
        }
    } catch {
        localStorage.removeItem(STORAGE_KEY);
    }
}

function formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
}
