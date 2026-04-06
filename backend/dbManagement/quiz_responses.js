import fs from "fs";

const type_map = {
    "scale": "INTEGER",
}

// Needed for other functions
let quiz;
export let table_name;
let column_names;
let column_placeholders;

function schema() {
    // TODO: Add foreign key constraint once user table is available
    // TODO: Add some way to store users current hobbies here as well
    //       Talk to current hobby team

    return `
CREATE TABLE IF NOT EXISTS ${table_name} (
    ResponseID INTEGER PRIMARY KEY,
    UserID INTEGER,
    ResultJSON TEXT NOT NULL,
${
        //  For all quiz questions:
        //      return "Question" + questionID + " " + "INTEGER" if type == scale else "TEXT"
        //  Join with ",\n"
        quiz.questions.map(q => `    Question${q.id} ${type_map[q.type]} NOT NULL`).join(",\n")
        }
);`;
}

/**
 * Attempts to add a hobby to the hobby database.
 * If it already exists, does nothing and returns the HobbyID.
 *
 * @returns HobbyID
 * @param {String} name 
 * @param {DBManager} manager 
 */
export async function add(user_id, answers, result, manager) {
    if (!answers || !result) { throw new Error("Answers and result are NOT NULL."); }
    if (answers.length != quiz.questions.length) { throw new Error(`Expected ${quiz.questions.length} answers, got ${answers.length}.`); }
    // Attempt to insert into table
    await manager.dbExecute(
        `INSERT OR IGNORE INTO ${table_name} (${column_names}) VALUES (${column_placeholders}) `,
        [user_id, JSON.stringify(result), ...answers]
    );
}

export async function init(quiz_path, manager) {
    quiz = JSON.parse(fs.readFileSync(quiz_path));

    table_name = `${quiz.quizId}_Responses`;
    column_names = `UserID, ResultJSON, ${quiz.questions.map(q => `Question${q.id}`).join(", ")}`;
    column_placeholders = `?, ?, ${quiz.questions.map(_ => "?").join(", ")}`;


    await manager.dbExecute(schema(quiz_path));
}

export default {
    add,
    init
}