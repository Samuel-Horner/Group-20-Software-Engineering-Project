import fs from "fs";
import path from "path";
import vm from "vm";
import { jest } from "@jest/globals";

const quizLogicPath = path.resolve("../public/quiz-logic.js");
const quizLogicSource = fs.readFileSync(quizLogicPath, "utf8");

function createHarness({ fetchImpl, formValues = [] }) {
    const submitHandlers = {};
    const documentHandlers = {};

    const formEl = {
        __values: formValues,
        addEventListener: jest.fn((event, handler) => {
            submitHandlers[event] = handler;
        }),
    };

    const quizTitleEl = { textContent: "" };
    const quizDescriptionEl = { textContent: "" };
    const quizQuestionsEl = { innerHTML: "" };
    const quizErrorEl = { textContent: "", style: { display: "none" } };

    const elementMap = {
        quizForm: formEl,
        quizTitle: quizTitleEl,
        quizDescription: quizDescriptionEl,
        quizQuestions: quizQuestionsEl,
        quizError: quizErrorEl,
    };

    const document = {
        cookie: "",
        getElementById: jest.fn((id) => elementMap[id]),
        addEventListener: jest.fn((event, handler) => {
            documentHandlers[event] = handler;
        }),
    };

    class MockFormData {
        constructor(form) {
            this.form = form;
        }

        *values() {
            for (const value of this.form.__values || []) {
                yield value;
            }
        }
    }

    const fetch = jest.fn(fetchImpl);
    const localStorage = { setItem: jest.fn() };
    const alert = jest.fn();
    const window = { location: { href: "" } };

    const context = {
        document,
        window,
        localStorage,
        alert,
        fetch,
        FormData: MockFormData,
        encodeURIComponent,
        decodeURIComponent,
        console,
        setTimeout,
        clearTimeout,
        setImmediate,
        Promise,
    };

    vm.createContext(context);
    vm.runInContext(quizLogicSource, context, { filename: quizLogicPath });

    return {
        fetch,
        alert,
        localStorage,
        document,
        window,
        quizTitleEl,
        quizDescriptionEl,
        quizQuestionsEl,
        quizErrorEl,
        runDOMContentLoaded: () => documentHandlers.DOMContentLoaded(),
        runSubmit: (event) => submitHandlers.submit(event),
    };
}

describe("quiz page logic", () => {
    test("renders quiz content on DOMContentLoaded", async () => {
        const quizPayload = {
            title: "Sample Quiz",
            description: "Test quiz data",
            questions: [
                {
                    id: 1,
                    text: "What's your favourite hobby?",
                    type: "multiple-choice",
                    options: ["Reading", "Gaming"],
                },
            ],
        };

        const harness = createHarness({
            fetchImpl: async () => ({
                ok: true,
                status: 200,
                json: async () => quizPayload,
            }),
        });

        await harness.runDOMContentLoaded();

        expect(harness.fetch).toHaveBeenCalledWith("/getQuiz", { method: "POST" });
        expect(harness.quizTitleEl.textContent).toBe("Sample Quiz");
        expect(harness.quizDescriptionEl.textContent).toBe("Test quiz data");
        expect(harness.quizQuestionsEl.innerHTML).toContain("What&#39;s your favourite hobby?");
        expect(harness.quizQuestionsEl.innerHTML).toContain("Reading");
    });

    test("submits answers and redirects when recommendation succeeds", async () => {
        const recommendationPayload = [
            [0.71, "video games"],
            [0.12, "football"],
        ];
        const expectedSerialized = JSON.stringify(recommendationPayload);
        const expectedEncoded = encodeURIComponent(expectedSerialized);

        const harness = createHarness({
            formValues: ["1", "2"],
            fetchImpl: async (url) => {
                if (url === "/api/quiz") {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({ hobby: recommendationPayload }),
                    };
                }
                throw new Error("Unexpected URL");
            },
        });

        const event = { preventDefault: jest.fn() };
        await harness.runSubmit(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(harness.fetch).toHaveBeenCalledWith("/api/quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: [1, 2], maskedHobbies: [] }),
        });
        expect(harness.localStorage.setItem).toHaveBeenCalledWith("userHobby", expectedSerialized);
        expect(harness.document.cookie).toContain(`userHobby=${expectedEncoded}`);
        expect(harness.window.location.href).toBe(`recommendation.html?hobby=${expectedEncoded}`);
    });

    test("shows alert when quiz API returns an error", async () => {
        const harness = createHarness({
            formValues: ["1"],
            fetchImpl: async (url) => {
                if (url === "/api/quiz") {
                    return {
                        ok: false,
                        status: 501,
                        text: async () => "Recommendation engine not implemented",
                    };
                }
                throw new Error("Unexpected URL");
            },
        });

        const event = { preventDefault: jest.fn() };
        await harness.runSubmit(event);

        expect(harness.alert).toHaveBeenCalledWith("Invalid input for recommendation page.");
    });
});
