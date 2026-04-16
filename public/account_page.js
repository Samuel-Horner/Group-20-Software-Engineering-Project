function error(message) {
    alert(message);
}

const signed_in_content = document.getElementById("signed-in-content");
const signed_out_content = document.getElementById("signed-out-content");

const username_display = document.getElementById("username-display");

const username = document.getElementById("username-input");
const password = document.getElementById("password-input");
const fullname = document.getElementById("fullname-input");
const description = document.getElementById("description-input");

let account_info;

async function updateAccountInfo() {
    fetch("/api/account/get", {
        method: "POST",
        credentials: "include",
    }).then(async res => {
        if (!res.ok) return;
        account_info = await res.json();

        username_display.innerText = `@${account_info["Username"]}`;
        fullname.value = account_info["Fullname"]; 
        description.value = account_info["Description"]; 
    })
}

function showSignedInContent() {
    // Assumes a valid session cookie
    username.value = "";
    password.value = "";

    signed_out_content.style.visibility = "hidden";
    signed_out_content.style.position = "fixed";

    signed_in_content.style.visibility = "visible";
    signed_in_content.style.position = "static";

    // Construct signed in content
    updateAccountInfo();
}

function showSignedOutContent() {
    signed_in_content.style.visibility = "hidden";
    signed_in_content.style.position = "fixed";

    signed_out_content.style.visibility = "visible";
    signed_out_content.style.position = "static";
}


document.getElementById("sign-in-submit").onclick = async () => {
    fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: username.value,
            password: password.value
        }),
        credentials: "include",
    }).then(async res => {
        if (res.ok) {
            showSignedInContent();
        }
        else {
            const msg = await res.text();
            if (msg) error(msg);
            else error("Failed sign in");
        }
    })
}

document.getElementById("create-account-submit").onclick = async () => {
    fetch("/api/account/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: username.value,
            password: password.value
        }),
        credentials: "include",
    }).then(async res => {
        if (res.ok) {
            showSignedInContent();
        }
        else {
            const msg = await res.text();
            if (msg) error(msg);
            else error("Failed to create account");
        }
    })
}

document.getElementById("sign-out-all-submit").onclick = async () => {
    fetch("/api/account/logout", {
        method: "POST",
        credentials: "include",
    }).then(async res => {
        if (!res.ok) error("Failed to sign out");
        showSignedOutContent();
    })
}

document.getElementById("save-changes-submit").onclick = async () => {
    fetch("/api/account/update", {
        method: "POST",
        body: JSON.stringify({
            "Fullname": fullname.value,
            "Description": description.value,
        }),
        credentials: "include",
    }).then(async res => {
        if (!res.ok) error("Failed to save changes");
    })
}

// On load, check if signed in
window.onload = () => {
    username.value = "";
    password.value = "";

    fetch("/api/account/validate", {
        method: "POST",
        credentials: "include",
    }).then(res => {
        if (res.ok) showSignedInContent();
        else showSignedOutContent();
    });
}