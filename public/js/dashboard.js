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

let form = document.getElementById("chat-form");
form.addEventListener("submit", (event) => {
    event.preventDefault();
    let inputMessage = document.getElementById("message");
    let message = inputMessage.value;

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
                    let chat = response.data.message;
                    let html = `<div class="curr-user-chat"><h5>${chat}</h5></div>`;
                    let chatContainer = document.getElementById("chat-container");
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
});

function showDashboard(userId) {
    let chatSection = document.getElementById("chat-section");
    let startHead = document.getElementById("start-head");

    startHead.setAttribute("hidden", false);
    chatSection.removeAttribute("hidden");

    receiver_id = document.getElementById(userId).getAttribute("id");
    socket.emit("getChats", { receiver_id, sender_id });
}

socket.on("getOnlineUser", (data) => {
    let status = document.getElementById(data + "-status");
    status.innerText = "Online";
    status.classList.remove("offline-status");
    status.classList.add("online-status");
});

socket.on("getOfflineUser", (data) => {
    let status = document.getElementById(data + "-status");
    status.innerText = "Offline";
    status.classList.remove("online-status");
    status.classList.add("offline-status");
});

// load current chat on the receiver side
socket.on("loadNewChat", (data) => {
    if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
        let html = `<div class="dist-user-chat"><h5>${data.message}</h5></div>`;
        let chatContainer = document.getElementById("chat-container");
        chatContainer.insertAdjacentHTML("beforeend", html);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    // in the else case means when user not open the sender chat dashboard then send notification
});

socket.on("loadChats", (data) => {
    let chatContainer = document.getElementById("chat-container");
    let inputMessage = document.getElementById("message");
    // clear the old chat fromm the chat container and also clearing the input field
    chatContainer.innerHTML = "";
    inputMessage.value = "";

    let chats = data;
    for (chat of chats) {
        let html;
        let addClass;
        if (chat.sender_id == sender_id) {
            addClass = "curr-user-chat";
        } else {
            addClass = "dist-user-chat";
        }
        html = `<div class=${addClass}><h5>${chat.message}</h5></div>`;
        chatContainer.insertAdjacentHTML("beforeend", html);
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
});
