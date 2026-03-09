var info = {"UserID": 0, "Username": "username1", "Password": "password1", "HobbyTags": ["Photography","Cooking","Gardening"]};
var all_tags= ["Photography","Cooking","Gardening","Woodworking","3D Printing","Gaming","Baking","Coffee Roasting","Guitar","Cycling","Electronics"];
var accountMode = 0;

function renderAccountPageFormat (accountMode) {
    var tag_changes = info.HobbyTags;
    //const userID = UserLogin();
    //const info = RetrieveAccInfo(userID);
    const userID = info.UserID;
    
    if (userID+1) {
        if (!accountMode) {
            var innerHTML = `
                <div class="content-section" style="gap: 42px">
                    <h3>Username</h3>
                    <div class="info-display">${info.Username}</div>
                </div>
                <div class="content-section" style="gap: 50px">
                    <h3>Password</h3>
                    <div class="info-display">${info.Password}</div>
                </div>
            `
            document.getElementById("user-content").innerHTML = innerHTML;

            innerHTML = `
                <div class="content-section" style="padding: 15px 15px 0px">
                    <h3>Hobby Tags</h3>
                </div>
                <div class="content-section" style="gap: 10px">
            `+(info.HobbyTags).map((hobby) => `
                    <div class="button-style">
                        <a href="/api/hobbies/${hobby}">${hobby}</a>
                    </div>
            `).join("")+"</div>";
            document.getElementById("tags-content").innerHTML = innerHTML;

            innerHTML = `
                <div class="editor-button">
                    <button id="editor-trigger">Edit Details</button>
                </div>
            `;
            document.getElementById("account-editor").innerHTML = innerHTML;

            const editor_trigger = document.getElementById("editor-trigger");
            editor_trigger.addEventListener("click",function (event) {event.target.style.display = "none"; renderAccountPageFormat(1)});
        }
        else {
            var not_hobby = all_tags.filter(hobby => !(info.HobbyTags).includes(hobby));
            var innerHTML = `
                <div class="content-section" style="gap: 42px">
                    <h3>Username</h3>
                    <div class="input-box">
                        <input id="username-input" type="text" placeholder="(Current) ${info.Username}" value=""/>
                    </div>
                </div>
                <div class="content-section"  style="gap: 50px">
                    <h3>Password</h3>
                    <div class="input-box">
                        <input id="password-input" type="text" placeholder="(Current) ${info.Password}" value=""/>
                    </div>
                </div>
            `
            document.getElementById("user-content").innerHTML = innerHTML;

            innerHTML = `
                <div class="content-section"  style="padding: 15px 15px 0px">
                    <h3>Hobby Tags</h3>
                </div>
                <div class="content-section" style="gap: 10px">
            `+(info.HobbyTags).map((hobby) => `
                    <div class="button-style">
                        <button class="remove-tag-trigger" value="${hobby}">${hobby}</button>
                    </div>
            `).join("")+`
                </div>
                <div class="content-section" style="gap: 10px">
            `+not_hobby.map((hobby) => `
                    <div class="button-style">
                        <button class="add-tag-trigger" value="${hobby}">${hobby}</button>
                    </div>
            `).join("")+"</div>";
            document.getElementById("tags-content").innerHTML = innerHTML;

            innerHTML = `
                <div class="editor-button">
                    <button id="confirm-trigger">Confirm Changes</button>
                    <button id="return-trigger">Cancel</button>
                </div>
            `;
            document.getElementById("account-editor").innerHTML = innerHTML;

            tag_changes = [...info.HobbyTags];
            const editor_trigger = document.getElementById("return-trigger");
            editor_trigger.removeEventListener("click",function () {renderAccountPageFormat(0)});
            editor_trigger.addEventListener("click",function () {renderAccountPageFormat(0)});

            accountEditor(tag_changes);
        }
    }
    else {
        document.getElementById("user-content").innerHTML = `
            <p style="text-align:center">You are not logged in...</p>
            <button style="padding: 14px 20px;"><a href="./index.html">Login to your account here</a></button>
        `
    }
}

function accountEditor (tag_changes) {
    document.querySelectorAll(".remove-tag-trigger").forEach((remove_tag_trigger) => {
            var clone = remove_tag_trigger.cloneNode(true);
            remove_tag_trigger.replaceWith(clone);
        })
    document.querySelectorAll(".add-tag-trigger").forEach((add_tag_trigger) => {
            var clone = add_tag_trigger.cloneNode(true);
            add_tag_trigger.replaceWith(clone);
        })
    var confirm_trigger = document.getElementById("confirm-trigger");
    var clone = confirm_trigger.cloneNode(true);
    confirm_trigger.replaceWith(clone);
    
    tagReRenderer(tag_changes);

    document.querySelectorAll(".remove-tag-trigger").forEach((remove_tag_trigger) => {
            remove_tag_trigger.addEventListener("click",function () {toRemoved(tag_changes,remove_tag_trigger.value);})
        })
    document.querySelectorAll(".add-tag-trigger").forEach((add_tag_trigger) => {
            add_tag_trigger.addEventListener("click",function () {toAdd(tag_changes,add_tag_trigger.value);})
        })
    confirm_trigger = document.getElementById("confirm-trigger");
    confirm_trigger.addEventListener("click",() => {makeChanges(tag_changes)});
}

function makeChanges (tag_changes) {
    const username_input = document.getElementById("username-input").value;
    const password_input = document.getElementById("password-input").value;
    if (!(username_input == "")) {info.Username = username_input;}
    if (!(password_input == "")) {info.Password = password_input;}
    console.log(tag_changes)
    info.HobbyTags = tag_changes;

    renderAccountPageFormat(0);
}

function tagReRenderer (tag_changes) {
    var not_hobby = all_tags.filter(hobby => !(tag_changes).includes(hobby));

    var innerHTML = `
        <div class="content-section"  style="padding: 15px 15px 0px">
            <h3>Hobby Tags</h3>
        </div>
        <div class="content-section" style="gap: 10px">
    `+(tag_changes).map((hobby) => `
            <div class="button-style">
                <button class="remove-tag-trigger" value="${hobby}">${hobby}</button>
            </div>
    `).join("")+`
        </div>
        <div class="content-section" style="gap: 10px">
    `+not_hobby.map((hobby) => `
            <div class="button-style">
                <button class="add-tag-trigger" value="${hobby}">${hobby}</button>
            </div>
    `).join("")+"</div>";
    document.getElementById("tags-content").innerHTML = innerHTML;
}

function toRemoved (tag_changes,hobby) {
    if ((tag_changes).includes(hobby)) {
        tag_changes = tag_changes.filter((kept) => !(kept == hobby));
    }
    accountEditor(tag_changes);
}

function toAdd (tag_changes,hobby) {
    if (all_tags.includes(hobby)) {
        tag_changes.push(hobby);
    }
    accountEditor(tag_changes);
}

renderAccountPageFormat();