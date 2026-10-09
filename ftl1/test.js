const TEST_ID = "FTL1";
const QUESTION_COUNT = 19;
const WORKING_TIME_MS = 2 * 60 * 60 * 1000;
const PAUSE_TIME_MS = 5 * 60 * 1000;
const MAX_PAUSES = 3;
const STORAGE_KEY = "limimake-ftl1-draft";

// There is intentionally no answer key here. Every answer is reviewed by a human.
const questions = [
    {
        part: "Part 1 · Multiple choice",
        type: "single",
        prompt: "Where is the green flag?",
        choices: ["Stage", "Toolbar", "Stories manager", "Bowl of soup"]
    },
    {
        part: "Part 1 · Multiple choice",
        type: "single",
        prompt: "What is a ScratchJr time unit?",
        choices: ["A humoungus skyscraper", "Two seconds", "A tenth of a second", "2,048 1,024ths of a sceond"]
    },
    {
        part: "Part 1 · Multiple choice",
        type: "single",
        prompt: "What color is the Control category?",
        choices: ["Orange", "Blue", "Yellow", "78%"]
    },
    {
        part: "Part 1 · Multiple choice",
        type: "single",
        prompt: "What was ScratchJr made to simplify?",
        choices: ["If you pass, it's what THAT's called", "I forgot what this choice was", "Cat++", "Scratch"]
    },
    {
        part: "Part 1 · Multiple choice",
        type: "single",
        prompt: "What does the Move Up block do?",
        choices: ["Put the character in a rocket", "Move the character up to the top of the two-dimensional stage", "Question 1: Where is the green flag?", "Shrinks the character as if it is moving away from you"]
    },
    {
        part: "Part 2 · Multiple answer",
        type: "multi",
        prompt: "What are real ScratchJr categories?",
        instruction: "Choose all that apply.",
        choices: ["Sensing", "Math", "Control", "Events"]
    },
    {
        part: "Part 2 · Multiple answer",
        type: "multi",
        prompt: "Which blocks can start a script?",
        instruction: "Choose all that apply.",
        choices: ["Green Flag", "Wait", "Start on Tap", "Go Home"]
    },
    {
        part: "Part 2 · Multiple answer",
        type: "multi",
        prompt: "Which blocks are in the Control category?",
        instruction: "Choose all that apply.",
        choices: ["Wait", "Move Right", "Repeat", "Say"]
    },
    {
        part: "Part 2 · Multiple answer",
        type: "multi",
        prompt: "What are areas of the ScratchJr interface?",
        instruction: "Choose all that apply.",
        choices: ["Stage", "Sounds tab", "Character List", "Toolbar"]
    },
    {
        part: "Part 3 · Text answer",
        type: "text",
        prompt: "Where is the Go Home button?"
    },
    {
        part: "Part 3 · Text answer",
        type: "text",
        prompt: "Where do you click to change a character's name?"
    },
    {
        part: "Part 3 · Text answer",
        type: "text",
        prompt: "Explain what the Stories Manager is."
    },
    {
        part: "Part 4 · True or false",
        type: "boolean",
        prompt: "The Wait block measures time in tenths of a second.",
        choices: ["True", "False"]
    },
    {
        part: "Part 4 · True or false",
        type: "boolean",
        prompt: "The Events category is orange.",
        choices: ["True", "False"]
    },
    {
        part: "Part 4 · True or false",
        type: "boolean",
        prompt: "The Green Flag is the only way a ScratchJr script can start.",
        choices: ["True", "False"]
    },
    {
        part: "Part 4 · True or false",
        type: "boolean",
        prompt: "The Stop block pauses the program and then continues automatically.",
        choices: ["True", "False"]
    },
    {
        part: "Part 4 · True or false",
        type: "boolean",
        prompt: "A character can have more than one script.",
        choices: ["True", "False"]
    },
    {
        part: "Part 4 · True or false",
        type: "boolean",
        prompt: "The Go Home block sends a character to the first page of the project.",
        choices: ["True", "False"]
    },
    {
        part: "Final project",
        type: "project",
        prompt: "Create a ScratchJr project that uses every concept taught in Level 1.",
        instruction: "Your final project is reviewed by a human. This screen does not grade it.",
        steps: [
            "Create a project that uses every concept covered in ScratchJr Level 1.",
            "Tap Rename and Share.",
            "Click ‘For Parents’, then solve the addition problem.",
            "Click ‘Share by Airdrop’, then click ‘Save’.",
            "Email the newly created FinalProject.sjr to questions@limiplake.com."
        ]
    }
];

const state = {
    testId: TEST_ID,
    studentId: "",
    studentName: "",
    theme: "sky",
    current: 0,
    answers: Array.from({ length: QUESTION_COUNT }, () => null),
    startedAt: null,
    workingRemainingMs: WORKING_TIME_MS,
    lastTickAt: null,
    pauseCount: 0,
    pauseStartedAt: null,
    pauseRemainingMs: PAUSE_TIME_MS,
    submitted: false
};

const welcomeScreen = document.getElementById("welcome-screen");
const testScreen = document.getElementById("test-screen");
const submittedScreen = document.getElementById("submitted-screen");
const studentForm = document.getElementById("student-form");
const questionCard = document.getElementById("question-card");
const partLabel = document.getElementById("part-label");
const partTitle = document.getElementById("part-title");
const progress = document.getElementById("progress");
const progressBar = document.getElementById("progress-bar");
const timer = document.getElementById("timer");
const saveStatus = document.getElementById("save-status");
const backButton = document.getElementById("back-button");
const nextButton = document.getElementById("next-button");
const pauseButton = document.getElementById("pause-button");
const pauseOverlay = document.getElementById("pause-overlay");
const pauseNumber = document.getElementById("pause-number");
const pauseTimer = document.getElementById("pause-timer");
const resumeButton = document.getElementById("resume-button");

let workingTimer = null;
let pauseTimerInterval = null;

studentForm.addEventListener("submit", startTest);
backButton.addEventListener("click", previousQuestion);
nextButton.addEventListener("click", nextQuestion);
pauseButton.addEventListener("click", pauseTest);
resumeButton.addEventListener("click", resumeTest);
document.getElementById("download-button").addEventListener("click", downloadAnswers);

restoreDraft();

function startTest(event) {
    event.preventDefault();
    if (!studentForm.reportValidity()) return;

    state.studentId = document.getElementById("student-id").value.trim();
    state.studentName = document.getElementById("student-name").value.trim();
    state.theme = document.querySelector("input[name=theme]:checked").value;
    state.startedAt = Date.now();
    state.lastTickAt = Date.now();
    state.workingRemainingMs = WORKING_TIME_MS;
    state.submitted = false;
    applyTheme();
    saveDraft("Saved");
    welcomeScreen.hidden = true;
    testScreen.hidden = false;
    renderQuestion();
    startWorkingTimer();
}

function renderQuestion() {
    const question = questions[state.current];
    const number = state.current + 1;
    partLabel.textContent = question.part;
    partTitle.textContent = question.type === "project" ? "Final Project" : `Question ${number}`;
    progress.textContent = `${number} of ${QUESTION_COUNT}`;
    progressBar.style.width = `${(number / QUESTION_COUNT) * 100}%`;
    questionCard.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = question.prompt;
    questionCard.appendChild(heading);

    if (question.instruction) {
        const instruction = document.createElement("p");
        instruction.className = "instruction";
        instruction.textContent = question.instruction;
        questionCard.appendChild(instruction);
    }

    if (question.type === "text") renderTextAnswer(question);
    if (question.type === "single" || question.type === "multi" || question.type === "boolean") renderChoices(question);
    if (question.type === "project") renderProject(question);

    backButton.disabled = state.current === 0;
    nextButton.textContent = state.current === QUESTION_COUNT - 1 ? "Submit test" : "Next";
}

function renderChoices(question) {
    const choices = document.createElement("div");
    choices.className = "choices";
    const saved = state.answers[state.current];
    const inputType = question.type === "multi" ? "checkbox" : "radio";

    question.choices.forEach((choice, index) => {
        const label = document.createElement("label");
        label.className = "choice";
        const input = document.createElement("input");
        input.type = inputType;
        input.name = `question-${state.current}`;
        input.value = String(index);
        input.checked = question.type === "multi" ? Array.isArray(saved) && saved.includes(index) : saved === index;
        input.addEventListener("change", saveCurrentAnswer);
        const text = document.createElement("span");
        text.textContent = choice;
        label.append(input, text);
        choices.appendChild(label);
    });
    questionCard.appendChild(choices);
}

function renderTextAnswer() {
    const input = document.createElement("textarea");
    input.className = "answer-box";
    input.placeholder = "Type your answer here...";
    input.value = typeof state.answers[state.current] === "string" ? state.answers[state.current] : "";
    input.addEventListener("input", saveCurrentAnswer);
    questionCard.appendChild(input);
}

function renderProject(question) {
    const box = document.createElement("div");
    box.className = "project-box";
    const list = document.createElement("ol");
    question.steps.forEach(step => {
        const item = document.createElement("li");
        item.textContent = step;
        list.appendChild(item);
    });
    const note = document.createElement("div");
    note.className = "project-note";
    note.textContent = "Only a human reviews your project. The website does not decide whether it passes.";
    box.append(list, note);
    questionCard.appendChild(box);
}

function saveCurrentAnswer() {
    const question = questions[state.current];
    if (question.type === "text") {
        state.answers[state.current] = questionCard.querySelector("textarea").value;
    } else if (question.type === "multi") {
        state.answers[state.current] = Array.from(questionCard.querySelectorAll("input:checked"), input => Number(input.value));
    } else if (question.type === "single" || question.type === "boolean") {
        const checked = questionCard.querySelector("input:checked");
        state.answers[state.current] = checked ? Number(checked.value) : null;
    } else if (question.type === "project") {
        state.answers[state.current] = "Project instructions shown; project submitted by email.";
    }
    saveDraft("Saved");
}

function previousQuestion() {
    saveCurrentAnswer();
    if (state.current > 0) {
        state.current -= 1;
        renderQuestion();
    }
}

function nextQuestion() {
    saveCurrentAnswer();
    if (state.current === QUESTION_COUNT - 1) {
        submitTest();
        return;
    }
    state.current += 1;
    renderQuestion();
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
            updateTimer();
            submitTest();
            return;
        }
        updateTimer();
        saveDraft("Saved");
    }, 1000);
}

function updateTimer() {
    timer.textContent = formatTime(state.workingRemainingMs);
}

function pauseTest() {
    saveCurrentAnswer();
    if (state.pauseCount >= MAX_PAUSES || state.pauseStartedAt || state.submitted) return;
    state.pauseCount += 1;
    state.pauseStartedAt = Date.now();
    state.pauseRemainingMs = PAUSE_TIME_MS;
    pauseNumber.textContent = state.pauseCount;
    pauseOverlay.hidden = false;
    pauseButton.disabled = true;
    updatePauseTimer();
    clearInterval(pauseTimerInterval);
    pauseTimerInterval = setInterval(updatePauseTimer, 1000);
    saveDraft("Paused");
}

function updatePauseTimer() {
    const remaining = PAUSE_TIME_MS - (Date.now() - state.pauseStartedAt);
    state.pauseRemainingMs = Math.max(0, remaining);
    pauseTimer.textContent = formatTime(state.pauseRemainingMs).slice(3);
    if (state.pauseRemainingMs <= 0) resumeTest();
}

function resumeTest() {
    if (!state.pauseStartedAt) return;
    state.pauseStartedAt = null;
    state.lastTickAt = Date.now();
    clearInterval(pauseTimerInterval);
    pauseOverlay.hidden = true;
    pauseButton.disabled = state.pauseCount >= MAX_PAUSES;
    saveDraft("Saved");
}

function submitTest() {
    saveCurrentAnswer();
    state.submitted = true;
    state.pauseStartedAt = null;
    clearInterval(workingTimer);
    clearInterval(pauseTimerInterval);
    saveDraft("Submitted");
    testScreen.hidden = true;
    submittedScreen.hidden = false;
    document.getElementById("submitted-student").textContent = `${state.studentName} (${state.studentId})`;
}

function saveDraft(status) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
    saveStatus.textContent = status === "Submitted" ? "Submitted" : `${status} just now`;
}

function restoreDraft() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
        const restored = JSON.parse(saved);
        if (restored.testId && restored.testId !== TEST_ID) return;
        Object.assign(state, restored);
        if (state.submitted) {
            applyTheme();
            welcomeScreen.hidden = true;
            submittedScreen.hidden = false;
            document.getElementById("submitted-student").textContent = `${state.studentName} (${state.studentId})`;
            saveStatus.textContent = "Submitted";
            return;
        }
        if (state.startedAt && state.studentId && state.studentName) {
            applyTheme();
            state.lastTickAt = Date.now();
            welcomeScreen.hidden = true;
            testScreen.hidden = false;
            renderQuestion();
            updateTimer();
            startWorkingTimer();
            saveStatus.textContent = "Restored saved test";
        }
    } catch {
        localStorage.removeItem(STORAGE_KEY);
    }
}

function applyTheme() {
    document.body.classList.remove("theme-mint", "theme-violet");
    if (state.theme === "mint") document.body.classList.add("theme-mint");
    if (state.theme === "violet") document.body.classList.add("theme-violet");
}

function downloadAnswers() {
    const payload = {
        testId: TEST_ID,
        studentId: state.studentId,
        studentName: state.studentName,
        submittedAt: new Date().toISOString(),
        humanReviewRequired: true,
        answers: state.answers
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${TEST_ID}-${state.studentId || "submission"}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map((value, index) => String(value).padStart(index === 0 ? 2 : 2, "0")).join(":");
}
