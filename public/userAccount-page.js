var TEST_INFO = {
    Fullname: "Null Null Null Null",
    Username: "console_log_null",
    Password: "nullthing001",
    Description: "",
    Location: "Somewhere in the ...",
    HobbyTags: ["Electronics", "Electronics", "Electronics"],
    HobbyExperience: ["Beginner", "Intermediate", "Advanced"],
    QuizResults: [],
    SessionKey: null,
};  // For the purpose of understanding the initial state of this user account record

// Pass this manually into the loginFunc() function on line 115
var TEST_USER_LOGIN = "console_log_null";
var TEST_PASS_LOGIN = "nullthing001";



// To store all the possible HobbyTags that can be selected as an option in the Account Editor
// Feel free to modify for the purposes of testing, or for adding/removing options
var all_tags = ["Photography","Cooking","Gardening","Woodworking","3D Printing","Gaming","Baking","Coffee Roasting","Guitar","Cycling","Electronics"];

function clearAllListeners(element) {
    const clone = element.cloneNode(true);
    element.parentNode.replaceChild(clone, element);
    return clone;
}

async function loginFunc (TEST_USER_LOGIN=null,TEST_PASS_LOGIN=null) {
    var user = document.getElementById("user_login").value;
    var pass = document.getElementById("pass_login").value;

    var response = await fetch('/acc_login',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({action: 'firstLogin',user: user,pass: pass}),
    });
    const sessionKey = await response.json();
    localStorage.setItem('user-key',JSON.stringify(sessionKey));
    renderAccountPageFormat(0);
}

async function accLogout () {
    var sessionKey = JSON.parse(localStorage.getItem('user-key'));
    localStorage.removeItem('user-key');
    var response = await fetch('/acc_login',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({action: 'logout', body: sessionKey}),
    });
    document.getElementById("account_editor").innerHTML = ``;
    renderAccountPageFormat(0);
}

async function accEditRenderer (mode,accInfo={}) {
    var innerHTML = `
        <div class="content_section" style="gap: 42px">
            <h3>Username</h3>
            <div class="input_box">
                <input id="username_input" type="text" placeholder="${accInfo.Username ? `(Current) ${accInfo.Username}` : ""}" value=""/>
            </div>
        </div>
        <div class="content_section"  style="gap: 50px">
            <h3>Password</h3>
            <div class="input_box">
                <input id="password_input" type="text" placeholder="${accInfo.Password ? `(Current) ${accInfo.Password}` : ""}" value=""/>
            </div>
        </div>
        <div class="content_section"  style="gap: 50px">
            <h3>Fullname</h3>
            <div class="input_box">
                <input id="fullname_input" type="text" placeholder="${accInfo.Fullname ? `(Current) ${accInfo.Fullname}` : ""}" value=""/>
            </div>
        </div>
        <div class="content_section"  style="gap: 50px">
            <h3>Description</h3>
            <div class="input_box">
                <input id="description_input" type="text" placeholder="${accInfo.Description ? `(Current) ${accInfo.Description}` : ""}" value=""/>
            </div>
        </div>
        <div class="content_section"  style="gap: 50px">
            <h3>Location</h3>
            <div class="input_box">
                <input id="location_input" type="text" placeholder="${accInfo.Location ? `(Current) ${accInfo.Location}` : ""}" value=""/>
            </div>
        </div>
        
        <div id="tag_only_changes"></div>
    `;
    document.getElementById("main_content").innerHTML = innerHTML;

    var diff = accInfo.HobbyExperience ? JSON.parse(JSON.stringify(accInfo.HobbyExperience)).filter((_,index) => (accInfo.HobbyTags.indexOf(accInfo.HobbyTags[index]) == index)) : [];
    var tags = accInfo.HobbyTags ? JSON.parse(JSON.stringify(accInfo.HobbyTags)).filter((kept,index,arr) => (arr.indexOf(kept) == index)) : [];
    var tag_changes = {tags: tags, diff: diff};

    if (mode == "change") {
        var base_info = JSON.parse(JSON.stringify(accInfo));
        accEditor("change",tag_changes,base_info);
    }
    else if (mode == "create") {
        accEditor("create",tag_changes,{});
    }
}

async function renderAccountPageFormat (accountMode) {
    var sessionKey = JSON.parse(localStorage.getItem('user-key'));

    if (JSON.stringify(sessionKey) == "null") {
        var innerHTML = `
            <div class="content_section" style="gap: 42px">
                <h3>Username</h3>
                <div class="input_box">
                    <input id="user_login" type="text" placeholder="user" value=""/>
                </div>
            </div>
            <div class="content_section"  style="gap: 50px">
                <h3>Password</h3>
                <div class="input_box">
                    <input id="pass_login" type="text" placeholder="pass" value=""/>
                </div>
            </div>

            <div class="content_section">
                <button id="login_trigger">Login</button>
                <button id="create_account">Create Account</button>
            </div>
        `
        document.getElementById("main_content").innerHTML = innerHTML;

        var login_trigger = document.getElementById("login_trigger");
        login_trigger = clearAllListeners(login_trigger);
        login_trigger.addEventListener("click",function (event) {loginFunc()});

        var create_account = document.getElementById("create_account");
        create_account = clearAllListeners(create_account);
        create_account.addEventListener("click",function (event) {accEditRenderer("create")});
    }
    else {
        var response = await fetch('/acc_login',{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({action: 'persistLogin',user: sessionKey.user, key: sessionKey.key}),
        });
        const accInfo = await response.json();
        
        if (!(JSON.stringify(accInfo) == "{}") && !(JSON.stringify(accInfo) == "[]")) {
            if (!accountMode) {
                var innerHTML = `
                    <div class="content_section" style="gap: 42px">
                        <h3>Username</h3>
                        <div class="info-display">${accInfo.Username}</div>
                    </div>
                    <div class="content_section" style="gap: 50px">
                        <h3>Password</h3>
                        <div class="info-display">${accInfo.Password}</div>
                    </div>
                    <div class="content_section" style="gap: 50px">
                        <h3>Fullname</h3>
                        <div class="info-display">${accInfo.Fullname}</div>
                    </div>
                    <div class="content_section" style="gap: 50px">
                        <h3>Description</h3>
                        <div class="info-display">${accInfo.Description}</div>
                    </div>
                    <div class="content_section" style="gap: 50px">
                        <h3>Location</h3>
                        <div class="info-display">${accInfo.Location}</div>
                    </div>
                    <div class="content_section" style="padding: 15px 15px 0px">
                        <h3>Hobby Tags</h3>
                    </div>
                    <div class="content_section" style="gap: 10px">
                `+(accInfo.HobbyTags).map((hobby) => `
                        <div class="hobby_tags_style">
                            <a href="/api/hobbies/${hobby}">${hobby}</a>
                        </div>
                `).join("")+"</div>";
                document.getElementById("main_content").innerHTML = innerHTML;

                innerHTML = `
                    <div class="editor_button">
                        <button id="editor_trigger">Edit Details</button>
                        <button id="logout_trigger">Logout</button>
                    </div>
                `;
                document.getElementById("account_editor").innerHTML = innerHTML;

                var editor_trigger = document.getElementById("editor_trigger");
                editor_trigger = clearAllListeners(editor_trigger);
                editor_trigger.addEventListener("click",function (event) {renderAccountPageFormat(1)});

                var logout_trigger = document.getElementById("logout_trigger");
                logout_trigger = clearAllListeners(logout_trigger);
                logout_trigger.addEventListener("click",function (event) {accLogout()});
            }
            else {
                accEditRenderer("change",accInfo);
            }
        }
        else {
            localStorage.removeItem('user-key');
            renderAccountPageFormat(0);
        }
    }
}

function accEditor (mode,tag_changes=null,base_info=null) {
    if (mode == "change") {
        tagReRenderer(mode,tag_changes,base_info);

        innerHTML = `
            <div class="editor_button">
                <button id="confirm_trigger">Confirm Changes</button>
                <button id="return_trigger">Cancel</button>
                <button id="delete_trigger">Delete Account</button>
            </div>
        `;
        document.getElementById("account_editor").innerHTML = innerHTML;

        var return_trigger = document.getElementById("return_trigger");
        return_trigger = clearAllListeners(return_trigger);
        return_trigger.addEventListener("click",function (event) {renderAccountPageFormat(0)});

        var confirm_trigger = document.getElementById("confirm_trigger");
        confirm_trigger = clearAllListeners(confirm_trigger);
        confirm_trigger.addEventListener("click",function (event) {makeChanges("change",tag_changes,base_info)});

        var delete_trigger = document.getElementById("delete_trigger");
        delete_trigger = clearAllListeners(delete_trigger);
        delete_trigger.addEventListener("click",function (event) {accEditor("delete",tag_changes,base_info)});
    }
    else if (mode == "create") {
        tagReRenderer(mode,tag_changes,base_info);

        innerHTML = `
            <div class="editor_button">
                <button id="create_trigger">Create Account</button>
            </div>
        `;
        document.getElementById("account_editor").innerHTML = innerHTML;

        var create_trigger = document.getElementById("create_trigger");
        create_trigger = clearAllListeners(create_trigger);
        create_trigger.addEventListener("click",function (event) {makeChanges("create",tag_changes,{})});
    }
    else if (mode == "delete") {
        tagReRenderer(mode,tag_changes,base_info);

        var innerHTML = `
            <div class="editor_button">
                <button id="confirm_trigger">Confirm Changes</button>
                <button id="return_trigger">Cancel</button>
                <h3>! Deletion Set !</h3>
            </div>
        `;
        document.getElementById("account_editor").innerHTML = innerHTML;

        var return_trigger = document.getElementById("return_trigger");
        return_trigger = clearAllListeners(return_trigger);
        return_trigger.addEventListener("click",function (event) {accEditor("change",tag_changes,base_info)});

        var confirm_trigger = document.getElementById("confirm_trigger");
        confirm_trigger = clearAllListeners(confirm_trigger);
        confirm_trigger.addEventListener("click",function (event) {makeChanges("delete");});
    }
}

function tagReRenderer (mode,tag_changes,base_info) {
    document.querySelectorAll(".remove_tag_trigger").forEach((remove_tag_trigger) => {clearAllListeners(remove_tag_trigger);})
    document.querySelectorAll(".add_tag_trigger").forEach((add_tag_trigger) => {clearAllListeners(add_tag_trigger);})

    var not_hobby = all_tags.filter(hobby => !(tag_changes.tags).includes(hobby));
    var innerHTML = `
        <div class="content_section"  style="padding: 15px 15px 0px">
            <h3>Hobby Tags</h3>
        </div>
        <div class="content_section" style="gap: 10px">
    `+(tag_changes.tags).map((hobby,index) => `
            <div class="hobby_tags_style">
                <button class="remove_tag_trigger" value="${hobby}">${hobby}</button>
            </div>
            <div class="difficulty_menu_style">
                <select id="menu_selector_${hobby}">
                    <option value="N/A">N/A</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </select>
            </div>
    `).join("")+`
        </div>
        <div class="content_section" style="gap: 10px">
    `+not_hobby.map((hobby) => `
            <div class="hobby_tags_style">
                <button class="add_tag_trigger" value="${hobby}">${hobby}</button>
            </div>
    `).join("")+"</div>";
    document.getElementById("tag_only_changes").innerHTML = innerHTML;

    (tag_changes.tags).map((hobby,index) => {
        var elem = document.getElementById(`menu_selector_${hobby}`);
        elem.value = tag_changes.diff[index];
    })

    document.querySelectorAll(".remove_tag_trigger").forEach((remove_tag_trigger) => {
            remove_tag_trigger.addEventListener("click",function () {toRemove(mode,tag_changes,remove_tag_trigger.value,base_info);});
        })
    document.querySelectorAll(".add_tag_trigger").forEach((add_tag_trigger) => {
            add_tag_trigger.addEventListener("click",function () {toAdd(mode,tag_changes,add_tag_trigger.value,base_info);});
        })
}

async function makeChanges (action,tag_changes=null,base_info=null) {
    const sessionKey = JSON.parse(localStorage.getItem('user-key'));

    if (action == "change" || action == "create") {
        var userInput = document.getElementById("username_input").value;
        var passInput = document.getElementById("password_input").value;
        
        if (action == "create" && (userInput == "" || passInput == "")) {
            accEditor("create",tag_changes,base_info);    // Should have a message that says smth like 'username or password cannot be empty'
            return;
        }

        var fullInput = document.getElementById("fullname_input").value;
        var descInput = document.getElementById("description_input").value;
        var locaInput = document.getElementById("location_input").value;
        var tagsInput = JSON.stringify(tag_changes.tags);
        var diffInput = JSON.stringify(tag_changes.diff);

        var changes = {
            user: (userInput == "" ? base_info.Username : userInput),
            pass: (passInput == "" ? base_info.Password : passInput),
            full: (fullInput == "" ? base_info.Fullname : fullInput),
            desc: (descInput == "" ? base_info.Description : descInput),
            loca: (locaInput == "" ? base_info.Location : locaInput),
            tags: tagsInput, diff: diffInput};
        var body = {sessionKey: sessionKey, changes: changes};
    }
    
    if (action == "change") {
        var newbody = {action: 'change', body: body};
    }
    else if (action == "create") {
        var newbody = {action: 'create', body: body};
    }
    else if (action == "delete") {
        var newbody = {action: 'delete', body: sessionKey};
    }

    var response = await fetch('/acc_update',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newbody),
    });
    if (action == "create") {
        const sessionKey = await response.json();
        localStorage.setItem('user-key',JSON.stringify(sessionKey));
    }

    document.getElementById("account_editor").innerHTML = ``;
    renderAccountPageFormat(0);
}

function toRemove (mode,tag_changes,hobby,base_info) {
    tag_changes = keepDiffTags(tag_changes);
    if (tag_changes.tags.includes(hobby)) {
        tag_changes.diff = tag_changes.diff.filter((_,index) => !(index == (tag_changes.tags).indexOf(hobby)))
        tag_changes.tags = tag_changes.tags.filter((kept) => !(kept == hobby));
    }
    accEditor(mode,tag_changes,base_info);
}

function toAdd (mode,tag_changes,hobby,base_info) {
    tag_changes = keepDiffTags(tag_changes);
    if (all_tags.includes(hobby)) {
        tag_changes.tags.push(hobby);
        tag_changes.diff.push("N/A");
    }
    accEditor(mode,tag_changes,base_info);
}

function keepDiffTags (tag_changes) {
    for (let i=0; i<tag_changes.diff.length; i++) {
        var elem = document.getElementById(`menu_selector_${tag_changes.tags[i]}`);
        tag_changes.diff[i] = elem.value;
    }
    return tag_changes;
}

renderAccountPageFormat(0); // node ./backend/index.js

/*
Styling Name Guide:
<id=main_content>        Generic style container for all the user account content
<class=content_section>  Generic style container for all notable elements (text,buttons,links) within <main_content>, can be changed/removed completely if required
<class=input_box>        Generic style container for all parts of an Input Box element
<class=hobby_tags_style> Generic style container for HobbyTags referral links, not really necessary to have, but makes it look more interactable
<type=button>            Generic style for all Button elements
<class=editor_button>    Generic style container for all the elements used in facilitating account editing

A lot of these are just very basic styles, which should ideally be changed to accommodate the style we have for the site as a whole
Additionally, almost all HTML code is made here in this JavaScript file, primarily so that interaction can be dynamic, while remaining on the same web-page

If assitance is required for anything relating to the Account System, both frontend or backend, feel free to contact Josh on Discord
*/