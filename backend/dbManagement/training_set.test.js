import { loadTrainingSetFromCSV } from "./training_set.js";

describe("Training Set Database", () => {
    test("Load CSV", async () => {
        expect(await loadTrainingSetFromCSV("./data/training_set.test.csv"))
            .toStrictEqual([[["video games", "running", "gym", "playing guitar"], 1, 0, 1, 1, 0.5, 1, -1, -0.5, 1, 1, 0, 0.5, 0.5, 1, 0.5]]);

        await expect(loadTrainingSetFromCSV("foo")).rejects.toThrow("File does not exist at foo. Check to make sure the file path to your csv is correct.");
    });
});