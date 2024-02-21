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

let socket = io("/user-namespace", {
    auth: {
        token: sender_id,
    },
});

let members = document.getElementsByClassName("addMembers");
// console.dir(members)
for (member of members) {

    member.addEventListener("click", (event) => {
        let groupId = event.target.id;
        // console.log(groupId);
        let table = document.getElementById("addMemberINTable");
        table.innerHTML = "";
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/chats/members', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        // Set up the data to send to the server
        const data = `groupId=${groupId}`;
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        let sl = 1;
                        let html = '';
                        for (user of response.users) {
                            html += `<tr>
                            <td>
                                <input type="checkbox" name="members[]" value="${user._id}">
                                ${sl++}
                            </td> 
                            <td>${user.username}</td> 
                            </tr>`
                        }
                        table.insertAdjacentHTML("beforeend", html);
                    } else {
                        alert(response.message);
                    }
                } else {
                    alert('Error occurred while making the request');
                }
            }
        };
        xhr.send(data);
    })
}