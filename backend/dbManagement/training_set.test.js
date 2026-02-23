import { loadTrainingSetFromCSV } from "./training_set.js";

describe("Training Set Database", () => {
    test("Load CSV", async () => {
        expect(await loadTrainingSetFromCSV("./data/training_set.test.csv"))
            .toStrictEqual([[["video games", "running", "gym", "playing guitar"], 5, 3, 5, 5, 4, 5, 1, 2, 5, 5, 3, 4, 4, 5, 4]]);

        await expect(loadTrainingSetFromCSV("foo")).rejects.toThrow("File does not exist at foo. Check to make sure the file path to your csv is correct.");
    });
});