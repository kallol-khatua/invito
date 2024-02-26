function getCookie(name) {
    let matches = document.cookie.match(
        new RegExp(
            "(?:^|; )" +
            name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
            "=([^;]*)"
        )
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
}
let userData = JSON.parse(getCookie('user'));

const sender_id = userData._id;
let receiver_id;

let socket = io("/user-namespace", {
    auth: {
        token: sender_id,
    },
});

// save message to database
let btn = document.getElementById("conversation-form-button")
btn.addEventListener("click", () => {
    let inputMessage = document.getElementById("conversation-main-message");
    let message = inputMessage.value.trim();
    console.log(message)
    if (message == "") {
        return;
    }
    // console.log(message);

    // send request to the server to show interest
    // Make an AJAX request to the server
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/chats/saveChat", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    let chatData = {
        receiver_id: receiver_id,
        sender_id: sender_id,
        message: message,
    };
    inputMessage.value = "";

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    let typing = document.getElementById("typing");
                    if (typing) {
                        typing.remove();
                    }
                    let chat = response.data.message;
                    html = `<li class="conversation-item me">
                                <div class="conversation-item-wrapper">
                                    <div class="conversation-item-box">
                                        <div class="conversation-item-text">
                                            <p>${chat}</p>
                                        </div>
                                    </div>
                                </div>
                            </li>`;
                    let chatContainer = document.getElementById("conversation-main-container");
                    chatContainer.insertAdjacentHTML("beforeend", html);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    // send current chat on the receiver side
                    socket.emit("newChat", response.data);
                } else {
                    alert(response.message);
                }
            } else {
                alert("Error occurred while making the request");
            }
        }
    };
    // Send the request with the data
    let jsonData = JSON.stringify(chatData);
    xhr.send(jsonData);
})

// let form = document.getElementById("chat-form");
// form.addEventListener("submit", (event) => {
//     event.preventDefault();
//     console.log("working");
// let inputMessage = document.getElementById("message");
// let message = inputMessage.value;

// // send request to the server to show interest
// // Make an AJAX request to the server
// const xhr = new XMLHttpRequest();
// xhr.open("POST", "/chats/saveChat", true);
// xhr.setRequestHeader("Content-Type", "application/json");

// let chatData = {
//     receiver_id: receiver_id,
//     sender_id: sender_id,
//     message: message,
// };
// inputMessage.value = "";

// xhr.onreadystatechange = function () {
//     if (xhr.readyState === XMLHttpRequest.DONE) {
//         if (xhr.status === 200) {
//             const response = JSON.parse(xhr.responseText);
//             if (response.success) {
//                 let chat = response.data.message;
//                 let html = `<div class="curr-user-chat"><h5>${chat}</h5></div>`;
//                 let chatContainer = document.getElementById("chat-container");
//                 chatContainer.insertAdjacentHTML("beforeend", html);
//                 chatContainer.scrollTop = chatContainer.scrollHeight;
//                 // send current chat on the receiver side
//                 socket.emit("newChat", response.data);
//             } else {
//                 alert(response.message);
//             }
//         } else {
//             alert("Error occurred while making the request");
//         }
//     }
// };
// // Send the request with the data
// let jsonData = JSON.stringify(chatData);
// xhr.send(jsonData);
// });

// show chat area
function showDashboard(userId, username, profile_image) {
    let conversation = document.getElementById("conversation-1");
    let conversationDefault = document.getElementById("conversation-default");

    conversationDefault.setAttribute("hidden", false);
    conversation.removeAttribute("hidden");

    // when max width 767px, then hide chat-sidebar and content-sidebar
    let x = window.matchMedia("(max-width: 767px)")
    if (x.matches) {
        let chatSidebar = document.getElementById("chat-sidebar");
        let contentSidebar = document.getElementById("content-sidebar");

        contentSidebar.setAttribute("hidden", false);
        chatSidebar.setAttribute("hidden", false);
    }


    receiver_id = document.getElementById(userId).getAttribute("id");
    // console.log(receiver_id);

    let topUsername = document.getElementById("conversation-top-username");
    topUsername.innerText = username
    document.getElementById("conversation-top-image").setAttribute("src", profile_image);

    let status = document.getElementById("conversation-top-status");
    let statusUser = document.getElementById(userId + "-status");
    status.innerText = statusUser.innerText;

    if (status.innerText == "Offline") {
        status.classList.remove("online");
        status.classList.add("offline")
    } else if (status.innerText == "Online") {
        status.classList.remove("offline");
        status.classList.add("online");
    }

    socket.emit("getChats", { receiver_id, sender_id });
}

function conversationBack() {
    let chatSidebar = document.getElementById("chat-sidebar");
    let contentSidebar = document.getElementById("content-sidebar");

    contentSidebar.removeAttribute("hidden");
    chatSidebar.removeAttribute("hidden");

    let chatContainer = document.getElementById("conversation-main-container");
    let inputMessage = document.getElementById("conversation-main-message");
    // clear the old chat fromm the chat container and also clearing the input field
    chatContainer.innerHTML = "";
    inputMessage.value = "";
}

// when get a user online 
socket.on("getOnlineUser", (data) => {
    let status = document.getElementById(data + "-status");
    status.innerText = "Online";
    status.classList.remove("offline-status");
    status.classList.add("online-status");

    if (data == receiver_id) {
        let status = document.getElementById("conversation-top-status");
        status.innerText = "Online";

        status.classList.remove("offline");
        status.classList.add("online");

    }
});

// when get a user offline 
socket.on("getOfflineUser", (data) => {
    let status = document.getElementById(data + "-status");
    // console.log(status)
    status.innerText = "Offline";
    status.classList.remove("online-status");
    status.classList.add("offline-status");
    if (data == receiver_id) {
        let status = document.getElementById("conversation-top-status");
        status.innerText = "Offline";

        status.classList.remove("online");
        status.classList.add("offline");

    }
});

// // load current chat on the receiver side
socket.on("loadNewChat", (data) => {
    if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
        let typing = document.getElementById("typing");
        if (typing) {
            typing.remove();
        }
        let html = `<li class="conversation-item">
            <div class="conversation-item-wrapper">
                        <div class="conversation-item-box">
                            <div class="conversation-item-text">
                               <p>${data.message}</p>
                            </div>
                        </div>
                    </div></li>`;
        let chatContainer = document.getElementById("conversation-main-container");
        chatContainer.insertAdjacentHTML("beforeend", html);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    // in the else case means when user not open the sender chat dashboard then send notification
});

socket.on("loadChats", (data) => {
    let chatContainer = document.getElementById("conversation-main-container");
    let inputMessage = document.getElementById("conversation-main-message");
    // clear the old chat fromm the chat container and also clearing the input field
    chatContainer.innerHTML = "";
    inputMessage.value = "";

    let chats = data;
    for (chat of chats) {
        let html;
        let addClass;
        if (chat.sender_id == sender_id) {
            html = `<li class="conversation-item me">
            <div class="conversation-item-wrapper">
                        <div class="conversation-item-box">
                            <div class="conversation-item-text">
                               <p>${chat.message}</p>
                            </div>
                        </div>
                    </div></li>`;
        } else {
            html = `<li class="conversation-item">
            <div class="conversation-item-wrapper">
                        <div class="conversation-item-box">
                            <div class="conversation-item-text">
                               <p>${chat.message}</p>
                            </div>
                        </div>
                    </div></li>`;
        }

        chatContainer.insertAdjacentHTML("beforeend", html);
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
});

// when sender will start typing send typing alert to the receiver
let inputField = document.getElementById("conversation-main-message");
inputField.addEventListener("keyup", () => {
    socket.emit("typing", { receiver_id, sender_id });
})

// catch typing 
socket.on("typing-receiver", (data) => {
    // when receiver will also open the sender screen then it will work
    if (receiver_id == data.sender_id) {
        let typing = document.getElementById("typing");
        if (!typing) {
            let html = `<li class="conversation-item" id="typing">
            <div class="conversation-item-wrapper">
                        <div class="conversation-item-box">
                            <div class="conversation-item-text">
                               <p>typing</p>
                            </div>
                        </div>
                    </div></li>`;
            let chatContainer = document.getElementById("conversation-main-container");
            chatContainer.insertAdjacentHTML("beforeend", html);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
})