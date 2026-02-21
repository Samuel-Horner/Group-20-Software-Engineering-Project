document.getElementById('quizForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const answers = [];
    
    for (let value of formData.values()) {
        const parsed = Number.parseInt(String(value).trim(), 10);
        if (Number.isNaN(parsed)) {
            alert("Please enter numeric answers for all questions.");
            return;
        }
        answers.push(parsed);
    }

    try {
        const resultHobby = await getHobbyReccomendation(answers);
        localStorage.setItem('userHobby', resultHobby);
        document.cookie = `userHobby=${encodeURIComponent(resultHobby)}; path=/; max-age=86400`;

        const encodedHobby = encodeURIComponent(resultHobby);
        window.location.href = `recommendation.html?hobby=${encodedHobby}`;

    } catch (error) {
        console.error("Backend Error:", error);
        alert(error?.message || "Something went wrong with the recommendation. Please try again.");
    }
});


async function getHobbyReccomendation(data) {
    const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ answers: data })
    });

    if (!response.ok) {
        const message = await response.text();
        const finalMessage = message || `Quiz API failed (${response.status})`;
        throw new Error(finalMessage);
    }

    const payload = await response.json();

    return payload.hobby;
}