
// Freely configurable, for establishing the table Name and Columns
function returnSchema () {
    return ["users",
    "username TEXT",
    "email TEXT",
    "takenQuiz BOOLEAN"
    ];
}

module.exports = {returnSchema};