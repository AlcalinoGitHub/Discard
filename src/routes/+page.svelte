<script>
    import { onMount } from 'svelte';
    import { writable, readable } from 'svelte/store';
    import {validateUser} from '$lib/auth.js'
    import Cookies from 'js-cookie'
    let isAUth
    let userName
    let friends = writable([])
    let ChatUser;
    let chatData;
    let ChatMessages = writable([])
    let friendRequest = writable([])
    let chatting_with;
    let chatId
    let server_user = writable([])


    async function getFriends(){
        let requestBody = {
            username: userName,
            type: 'GET_FRIENDS'
        }
        let response = await fetch('/',{
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        let data = await response.json()
        data = JSON.parse(data)
        console.log(data)
        data = data
        data = (data)
        console.log(data)
        friends.set(data)
        return data
    }

    async function getFriendRequests(){
        let requestBody = {
            username: userName,
            type: 'GET_FRIEND_REQUESTS'
        }

        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        console.log(response)
        let data = await response.json()
        console.log(data)
        return data
    }

    async function getServers(){
        let requestBody = {
            username: userName,
            type: 'GET_SERVERS_USER_IS_MEMBER'
        }

        let response  = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })

        let data = await response.json()
        console.log(data)
        return data
    }


    onMount(async () => {
        let authData = Cookies.get('AUTH');
        console.log(authData)
        let username
        try {username = JSON.parse(authData).username} catch {window.location.href = '/accounts'}
        userName = username
        isAUth = await validateUser(authData)
        console.log(isAUth)
        console.log(username)
        if (!isAUth){window.location.href = '/accounts'}

        let friendData = await getFriends();
        friends.set(friendData)

        let friend_request_data = await getFriendRequests()
        console.log(friend_request_data)
        friendRequest.set(friend_request_data) 

        let server_user_data = await getServers()
        server_user.set(server_user_data)
        console.log(server_user_data)
    })
    const logout = () => {Cookies.remove('AUTH'); window.location.href = '/'}

    let queried_users = writable([])
    async function userQuery(){
        let query = document.getElementById('friendQuery').value
        if (query == ''){queried_users.set([]);return}
        let reqBody = {
            search: query,
            type: 'USER_SEARCH'
        }

        let response = await fetch('/', {
            method:'POST',
            body: JSON.stringify(reqBody)
        })
        let data = await response.json()
        data = data.users
        queried_users.set(data)
    }

    async function addFriend(id){
        console.log(id)
        let requestBody = {
            friend_id: id,
            sender_username: userName,
            type: 'ADD_FRIEND'
        }
        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        let state = await response.json()
        state = state.state
        getFriends()
        console.log(state)
    }

    let updateChat = null;
    async function handleChats(user_id){
        console.log('HANDLE CHAT CALL')
        chatting_with = user_id
        if (updateChat){clearInterval(updateChat)}
        getUserChat(user_id)
        updateChat = setInterval(() => getUserChat(chatting_with), 5000)
    }


    async function getUserChat(user_id){
        let friendData = await getFriends();
        let areFriend = false
        //console.log(friendData)
        for (let friend of friendData){if (friend.id == user_id){areFriend = true; ChatUser = friend}}
        if (!areFriend){return}
        chatData =  await getChatData()
        console.log(chatId)
        let chat_messages_data = await getMessages()
        console.log(chat_messages_data)
        ChatMessages.set(chat_messages_data)
        //console.log(chatData)
    }

    async function getChatData(){
        let requestBody = {
            sender: userName,
            chat_with: ChatUser,
            is_group: false,
            chat_name: null,
            type: 'GET_CHAT'
        }
        let response = await fetch('/', {
            method: 'POST',
            body: JSON.stringify(requestBody)
        })
        let data = await response.json()
        console.log(data)
        return data
    }

    async function getMessageUsername(message){
        const {sender} = message
        console.log(sender)
        let requestBody = {
            id: sender,
            type: 'GET_USERNAME'
        }
        let response = await fetch('/', {
            method: 'POST',
            body: JSON.stringify(requestBody)
        })
        let data = await response.json()
        console.log(data)
        return data
    }

    async function getMessages(){
        let chat_id = chatData.id
        let chat_is_group = chatData.is_group
        if (chat_is_group == false){
            let requestBody = {
                chat_id: chat_id,
                chat_is_group: chat_is_group,
                channel_id: null,
                type: 'GET_MESSAGES'
            }
            let response = await fetch('/', {
                body: JSON.stringify(requestBody),
                method: 'POST'
            })
            let data = await response.json()
            for (let i = 0; i < data.length; i ++){
                data[i].username = await getMessageUsername(data[i])
            }
            data  = await sortById(data)
            console.log(data)
            return data
        }
    }

    async function sendMessage(){
        console.log(chatData)
        let message = document.getElementById('newMessage').value
        if (message.length == 0){return}
        let newMessage = {
            body: message,
            username: userName
        }
        ChatMessages.update(messages => [...messages, newMessage])

        if (chatData.is_group == false){
            console.log(message)

            let requestBody = {
                message:message,
                meta_data: chatData,
                sender: userName,
                type: 'SEND_MESSAGE'
            }

            let response = await fetch('/', {
                body: JSON.stringify(requestBody),
                method: 'POST'
            })
            let data = await response.json()
            if (data){
                let chat_messages_data = await getMessages()
                console.log(chat_messages_data)
                ChatMessages.set(chat_messages_data)
            }
        }
    }

    async function deleteMessage(id){
        console.log(id)
        let message = document.getElementById(id)
        let button  = document.getElementById(`delete ${id}`)
        message.innerHTML = 'deleting...'
        button.style.display = 'none'
        let requestBody = {
            message_id:id,
            type: 'DELETE_MESSAGE'
        }
        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        let data = await response.json()
        let chat_messages_data = await getMessages()
        console.log(chat_messages_data)
        ChatMessages.set(chat_messages_data)
    }

    async function deleteFriends(friend_id){
        console.log(friend_id)
        let friends_get = await getFriends()
        let newFriends = []
        for (let friend of friends_get){if (friend.id != friend_id){newFriends.push(friend)}}
        let DB_Friends = newFriends.map(friend => {return friend.id})
        console.log(newFriends)
        console.log(DB_Friends)
        friends.set(newFriends)
        let requestBody = {
            new_Friend: DB_Friends,
            username: userName,
            type: 'DELETE_FRIEND'
        }
        let response = await fetch('/',{
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        let data = await response.json()
        console.log(data)

        let friend_request_data = await getFriendRequests()
        friendRequest.set(friend_request_data) 

        let friendData = await getFriends();
        console.log(friendData)

        console.log(chatting_with)
        let isStillFriend = false
        for (let friend of friendData){
            if (friend.id == chatting_with){isStillFriend = true}
        }
        if (!isStillFriend){chatData = null; ChatUser = null}
    }

    async function acceptFriend(id){
        console.log(id)
        let response = await addFriend(id)

        let friendData = await getFriends();
        friends.set(friendData)

        let friend_request_data = await getFriendRequests()
        friendRequest.set(friend_request_data) 
    }

    //GROUP CHAT RELATED CODE STARTS HERE 
    let queried_server_users = writable([])
    let added_users = []

    async function user_server_query(){ //Pretty much just the friend query
        let query = document.getElementById('userServerQuery').value
        if (query == ''){queried_server_users.set([]);return}
        let reqBody = {
            search: query,
            type: 'USER_SEARCH'
        }

        let response = await fetch('/', {
            method:'POST',
            body: JSON.stringify(reqBody)
        })
        let data = await response.json()
        data = data.users
        let response_data = []
        for(let user of data){if (added_users.includes(user.username) == false){response_data.push(user)}}
        console.log(response_data)
        queried_server_users.set(response_data)
    }

    let added_users_ui = writable([])
    async function addUserToServer(user){
        console.log(user)
        if (added_users.includes(user.username) == false){added_users.push(user.username)}
        added_users_ui.set(added_users)
        console.log(added_users)
        user_server_query()
    }

    async function delete_server_user(username){
        console.log(username)
        console.log(added_users)
        added_users = added_users.filter(user => user != username)
        added_users_ui.set(added_users)
        console.log(added_users)
        user_server_query()
    }

    async function create_server(){
        let serverName = document.getElementById('serverName').value
        let serverUsers = added_users
        serverUsers.push(userName)
        console.log(serverUsers, serverName)
        let requestBody = {
            server_name: serverName,
            users: serverUsers,
            creator: userName,
            type: 'CREATE_GROUP_CHAT'
        }
        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })

        let data = await response.json()
        console.log(data)
    }

    let GroupChatId;
    let server_members = writable([]);
    let Current_Channel;
    let Channels;
    let Channels_ui = writable([])
    let GroupMessages = writable([])
    let server_name
    let channel_messages = writable([])
    let admins = []
    let admins_ui = writable([])
    let isAdmin;
    let members;
    let invatableFriends = writable([])
    function sortById(array) {
        return array.sort((a, b) => {
            const idA = parseInt(a.id);
            const idB = parseInt(b.id);
            if (idA < idB) {
            return -1;
            }
            if (idA > idB) {
            return 1;
            }
            return 0;
        });
}

    let server_data
    async function getServerData(server){
        server_data = server
        let id = server.id
        server_name = server.name
        let requestBody = {
            id: id,
            name: server_name,
            type: 'GET_SERVER_DATA'
        }
        
        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        let data = await response.json()
        console.log(data)
        GroupChatId = id

        admins = data.admins
        console.log(admins)
        admins_ui.set(admins)

        members = data.members
        for (let i = 0; i < members.length; i++){
            members[i].isAdmin = await validateAdmin(admins, members[i].username)
        }
        console.log(members)
        server_members.set(members) 

        GroupMessages.set(data.messages)

        Channels = data.channels
        Channels_ui.set(data.channels)
        Current_Channel = Channels[0]
        console.log(Current_Channel)


        let current_channel_messages = await getGroupMessages()
        current_channel_messages = sortById(current_channel_messages)
        console.log(current_channel_messages)

        channel_messages.set(current_channel_messages)
        ChatUser = null
        chatData = null
        clearInterval(updateChat)
        updateChat = null
        isAdmin = await validateAdmin(admins, userName)
        console.log(isAdmin)

        let friends =  await getFriends()
        console.log(friends)
        console.log(members)

        const ValidateFriendNotOnServer = (friend_id) => {
            console.log(friend_id)
            let members_id = members.map(member => member.id)
            for (let member of members_id){if (member == friend_id)return false}
            return true
        }
        console.log(friends)
        friends = friends.filter(friend => ValidateFriendNotOnServer(friend.id))
        console.log(friends)
        invatableFriends.set(friends)
    }

    async function SendGroupMessage(){
        let message = document.getElementById('serverMessage').value
        let sender = userName
        let chat_id = GroupChatId
        let channel_id = Current_Channel.id
        console.log(message, sender, chat_id, channel_id)
        let requestBody = {
            channel_id: channel_id,
            chat_id: chat_id,
            body: message,
            sender: sender,
            type: 'SEND_GROUP_MESSAGE'
        }
        channel_messages.update(current_messages => [...current_messages, requestBody])
        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        let data = await response.json()
        console.log(data)
        let current_channel_messages = await getGroupMessages()
        console.log(current_channel_messages)
        channel_messages.set(current_channel_messages)
    }

    let updateChannel = null
    let channel_name = writable()
    async function getGroupMessages(){
        console.log(GroupChatId)
        channel_name.set(Current_Channel.name)
        let requestBody = {
            channel_id: Current_Channel.id,
            chat_id: GroupChatId,
            type: 'GET_CHANNEL_MESSAGES'
        }
        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        let data = await response.json()
        console.log(data)
        data = sortById(data)
        channel_messages.set(data)
        if (!updateChannel){updateChannel =  setInterval(() => getGroupMessages(), 5000)}

        return data
    }
    async function validateAdmin(admins, username){
        console.log(admins, username)
        for (let admin of admins){
            if (admin.username == username){return true}
        }
        return false
    }

    async function createChannel(){
        console.log(Channels)
        let newChannel = document.getElementById('newChannelName').value
        console.log(newChannel)
        if (newChannel == ''){return}
        for (let channel of Channels){
            if (channel.name == newChannel){return}
        }
        let chat_id = GroupChatId
        let requestBody = {
            channel_name: newChannel,
            chat_id: chat_id,
            type: 'CREATE_NEW_CHANNEL'
        }
        console.log(requestBody)
        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })

        let data = await response.json()
        if (data){
        //$Channels_ui as Channel
            Channels_ui.set(data)
        }
        else {alert('An error has ocurred')}

    }

    async function changeChannel(Channel){
        console.log(Channel)
        let channel_id = Channel.id
        let channel_name = Channel.name
        console.log(channel_id, channel_name)
        Current_Channel.id = channel_id
        Current_Channel.name = channel_name
        console.log(Current_Channel.id, Current_Channel.name)
        getGroupMessages()
    }

    async function changeToGeneralChannel(){
        console.log('changing to general')
        getServerData(server_data)
        console.log(Current_Channel.id)
        console.log(Current_Channel.name)
        getGroupMessages()
    }

    async function grantAdmin(member){
        console.log(member)
        let requestBody = {
            chat_id: GroupChatId,
            member: member,
            sender: userName,
            type: 'GRANT_ADMIN'
        }
        console.log(requestBody)

        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })

        let data = await response.json()
        console.log(data)
        server_members.set(data)

    }

    async function revokeAdmin(member){
        console.log(member)
        let requestBody = {
            chat_id: GroupChatId,
            member: member,
            sender: userName,
            type: 'REVOKE_ADMIN'
        }
        console.log(requestBody)

        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })

        let data = await response.json()
        console.log(data)

        members = data.users
        admins = data.admins
        for (let i = 0; i < members.length; i++){
            members[i].isAdmin = await validateAdmin(admins, members[i].username)
        }
        server_members.set(members) 
        



    }

    async function KickOut(member){
        let current_channel = channel_name
        console.log(member)
        let requestBody = {
            chat_id: GroupChatId,
            member: member,
            sender: userName,
            type: 'KICK_OUT'
        }
        console.log(requestBody)

        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })

        let data = await response.json()
        getServerData(server_data)
    }

    async function InviteToServer(friend){
        let requestBody = {
            friend: friend,
            chat_id: GroupChatId,
            sender: userName,
            type: 'INVITE_FRIEND'
        }
        friend.isAdmin = false
        members.push(friend)
        server_members.set(members)
        console.log(requestBody)
        let response = await fetch('/', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        let data = await response.json()   

        let friends =  await getFriends()
        console.log(friends)
        console.log(members)

        const ValidateFriendNotOnServer = (friend_id) => {
            console.log(friend_id)
            let members_id = members.map(member => member.id)
            for (let member of members_id){if (member == friend_id)return false}
            return true
        }
        console.log(friends)
        friends = friends.filter(friend => ValidateFriendNotOnServer(friend.id))
        console.log(friends)
        invatableFriends.set(friends)  
    }



</script>

<h1>Discard TM ©</h1>
<div on:click={logout}>Logout</div>

<div>
    <div>Add friend</div>
    <input type = 'text' id = 'friendQuery' on:input={userQuery}>
    
    {#each $queried_users as user}
        {#if user.username != userName}
            <div on:click={addFriend(user.id)}>{user.username}</div>
        {/if} 
    {/each}
</div>

<div>
    <div>Chat with a friend</div>
    <div>
        {#each $friends as friend} 
            <div on:click={handleChats(friend.id)}> {friend.username} </div>
            <button on:click = {deleteFriends(friend.id)}>unfriend</button>
        {/each}
    </div>

</div>

<br>

<div id = 'friend_requests'>
    <div>Friend requests</div>
    {#each $friendRequest as request}
        <div on:click = {acceptFriend(request.id)}>{request.username}</div>
    {/each}
</div>


{#if ChatUser && chatData}
    <div id = 'chat_with_a_friend'>
        <br>
        chatting with:{ChatUser.username} <br>
        <small>chat_id: {chatData.id}</small>

        <div>
            {#if $ChatMessages.length == 0}
                <div>no messages</div>
            {:else}
                <div>
                    {#each $ChatMessages as message}
                        {#if message.id != undefined}
                            <div id = {message.id}>{message.username}:{message.body} <small>{message.id}</small></div>
                            {#if message.username == userName}
                                <button on:click = {deleteMessage(message.id)} id = 'delete {message.id}'>delete</button>
                            {/if}
                        {:else}
                        <div>{message.username}:{message.body} <small>sending...</small></div> 
                        {/if}
                    {/each}
                </div>
            {/if}
        </div>

        <form on:submit = {sendMessage}>
            <input type = text id = 'newMessage'>
            <input type = 'submit'>
        </form>
    </div>
{/if}



<div>
    <br>
    <div>Create a server</div>
    <form on:submit={create_server}>
        <input type = 'text' id = 'serverName' placeholder = 'server name' required> <br>
        <input type = 'text' id = 'userServerQuery' on:input={user_server_query} placeholder = 'look for users to add'>
        <input type = 'submit'>
    </form>
    {#each $queried_server_users as user}
        {#if user.username != userName}
            <div on:click = {addUserToServer(user)}>{user.username}</div>
        {/if} 
    {/each}
    <br>

    <div>Add a friend</div>
        {#each $friends as friend} 
            <div on:click = {addUserToServer(friend)}> {friend.username} </div>
        {/each}

    <br>
    <div>Added users:</div>
    {#each $added_users_ui as user}
        <div on:click = {delete_server_user(user)}>{user}</div>
    {/each}
</div>

<br><br>
<div>
    <div>Your servers:</div>
    {#each $server_user as server}
        <div on:click={getServerData(server)}>{server.name}</div>
    {/each}
</div>
<br><br>

{#if GroupChatId && !ChatUser}
    <div>Server: {server_name}</div>

    <div>Channel: {$channel_name}</div>

    <i> Enter a Channel </i>
    <div>General <button on:click = {changeToGeneralChannel}>Enter</button></div>
    {#each $Channels_ui.slice(1) as Channel}
        <div>
            {Channel.name} <small>id: {Channel.id}</small>
            <button on:click = {changeChannel(Channel)} >Enter</button>
        </div> 
    {/each}
    <br>

    {#if $channel_messages.length == 0}
        <div>Such empty</div>
    {:else}
        {#each $channel_messages as message}
            {#if message.id}
                <div id = {message.id}> {message.sender}:{message.body} <small>{message.id}</small> </div>
                {#if message.sender == userName}
                    <button on:click={deleteMessage(message.id)} id = 'delete {message.id}'>Delete</button>
                {/if}
            {:else}
                <div> {message.body} <small>sending...</small> </div>
            {/if}
        {/each}
    {/if}
    <form on:submit={SendGroupMessage}>
        <input type = 'text' id = 'serverMessage'>
        <input type = 'submit'>
    </form>

    <button on:click={getGroupMessages}>Refresh</button>

    {#if isAdmin}
        <div>
            Admin Panel
        </div>

        <h4>manage Users</h4>
        {#each $server_members as member}
                <div>
                    {member.username}
                    {#if member.username != userName}
                        <button on:click = {KickOut(member)}>Kick Out</button>
                    {/if}
                    {#if member.isAdmin == false}
                        <button on:click = {grantAdmin(member)}>Grant Admin</button>
                    {:else}
                        <button on:click = {revokeAdmin(member)}>Revoke Admin</button>
                    {/if}
                </div>
        {/each}
        <br>
        <h4>Add a user</h4>
        {#each $invatableFriends as friend} 
            <div> {friend.username}  <button on:click={InviteToServer(friend)}>Add</button></div>
        {/each}

        <br>
        <h4>Create Channels</h4>
        <form on:submit={createChannel}>
            <input type = 'text' id = 'newChannelName' placeholder = 'Name for new Channel'>
            <input type = 'submit'>
        </form>
    {/if}
{/if}


