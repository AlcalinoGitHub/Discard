import {supabase} from '$lib/supabase.js'
import {getFriends, userQuery} from '$lib/queries.js'


async function addFriend(sender, add){
    console.log(sender)
    //console.log(sender, add)
    let friends = await getFriends(sender)
    friends = (JSON.parse(friends))
    friends = friends.map(friend => friend.id)
    console.log(friends)
    if (friends.includes(add) == false){friends.push(add)} else {return {state: false}}
    const {data, error} = await supabase
        .from('users')
        .update({friends:friends})
        .eq('username', sender)
    if (error){console.log(error)} else {return {state: true}}
}

async function getUser(username){
    const {data, error} = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
    if (error){console.log(error)}
    if (data){return data[0]}
}

async function getUsername(id){
    console.log(id)
    const {data, error} = await supabase
        .from('users')
        .select('*')
    if (error){console.log(error)}
    console.log(data)
    for (let user of data){if (user.id == id){return user.username}}
}

async function createChat(request){
    const {sender_id, chat_with, is_group, chat_name} = request
    console.log(sender_id, chat_with, is_group, chat_name)
    if (!is_group){
        let owners = [parseInt(sender_id), parseInt(chat_with)].sort()
        let name = null
        let is_group = false
        console.log(owners, name, is_group)
        const {data, error} = await supabase
            .from('chats')
            .insert([{owners, name, is_group}])
        if (error){console.log(error)} else if (data){return data[0]}
    }
}

async function getChatData(requestBody){
    let {sender, chat_with, is_group, chat_name} = requestBody
    const re_send = requestBody
    console.log(sender, chat_with, is_group, chat_name)
    chat_with = chat_with.id
    console.log(sender, chat_with, is_group, chat_name)
    if (!is_group){
        console.log('looking for a one-one chat')
        let sender_id = await getUser(sender)
        sender_id = sender_id.id
        console.log(sender_id)
        let {data, error} = await supabase 
            .from('chats')
            .select('*')
        if (error){console.log(error); throw(error)}
        sender_id = `${sender_id}`
        chat_with = `${chat_with}`
        const request_owners = [(sender_id), (chat_with)].sort()
        for (let chat of data){
            let chat_owners = (chat.owners.sort())
            chat_owners = chat_owners.map(element => `${element}`)
            if (chat_owners[0] === request_owners[0] && chat_owners[1] === request_owners[1]){
                console.log(request_owners)
                console.log(chat_owners)
                console.log(chat)
                return chat
            } 
        }
        console.log(sender_id)
        createChat({sender_id, chat_with, is_group, chat_name})
        return getChatData(re_send)
    }
}

async function getMessages(requestBody){
    const {chat_id, chat_is_group, channel_id} = requestBody
    console.log(chat_id, chat_is_group, channel_id)
    if (!chat_is_group){
        const {data, error} = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat_id)
        console.log(data)
        return data
    }
}

async function sendMessage(requestBody){
    let {message, meta_data, sender} = requestBody
    const {id, name, is_group} = meta_data
    console.log(id, name, is_group)
    sender = await getUser(sender)
    sender = sender.id
    if (!is_group){
        let chat_id = id
        let body = message
        const {data, error} = await supabase 
            .from('messages')
            .insert([{sender, body, chat_id}])
        if (error){console.log(error)} else return true
    }
}

async function deleteMessage(id){
    const {data, error} = await supabase
        .from('messages')
        .delete()
        .eq('id', id)
    if (!error){return true} else {console.log(error)}
}

async function deleteFriend(requestBody){
    console.log(requestBody)
    let  {new_Friend} = requestBody
    new_Friend = new_Friend.map(friend => friend.toString()) 
    console.log(new_Friend)
    const {data, error} = await supabase
        .from('users')
        .update({friends: new_Friend})
        .eq('username', requestBody.username)
    if (error){console.log(error)} else {return true}
}

async function getFriendRequests(requestBody){
    console.log(requestBody)
    let user_id = await getUser(requestBody.username)
    user_id = user_id.id
    let friends = await getFriends(requestBody.username)
    friends = await JSON.parse(friends)
    friends = friends.map(friend => friend.id)
    console.log(friends)
    console.log(user_id)
    const validate_chat = (owners, friends) => {

        for (let id of owners){
            if (friends.includes(id)){return false}
        }
        return true
    }
    let {data, error} = await supabase
        .from('chats')
        .select('*')
    data = data.filter(element => element.is_group == false)
    console.log(data)
    let requested_friendships = []
    for (let chat of data){
        let owners = chat.owners
        console.log(owners)
        let isRequest = () => {
            for (let owner of owners){if (owner == user_id){return true}}
            return false
        }
        console.log(isRequest)
        if (isRequest){
            console.log(owners)
            let friend_request = owners.filter(owner => owner != user_id)
            console.log(friend_request)
            if (friend_request.length != 0){requested_friendships.push(friend_request[0])}
        }
    }
    console.log(requested_friendships)
    let requested_friendships_procesado = []
    for (let user of requested_friendships){
        let data = {
            id: user,
            username: await getUsername(user)
        }
        requested_friendships_procesado.push(data)
    }
    let alreadyFriended = await getFriends(requestBody.username)
    alreadyFriended = await JSON.parse(alreadyFriended)
    alreadyFriended = alreadyFriended.map(friend => friend.id)
    requested_friendships_procesado = requested_friendships_procesado.filter(friendship => alreadyFriended.includes(friendship.id) == false)
    console.log(alreadyFriended)
    console.log(requested_friendships_procesado)

    return requested_friendships_procesado
}


async function createServer(requestBody){
    console.log(requestBody)
    let name = requestBody.server_name
    let is_group = true
    let owners = requestBody.users
    let admins = [(await getUser(requestBody.creator)).id]
    console.log(admins)
    for (let i = 0; i < owners.length; i ++){
        owners[i] = await getUser(owners[i])
        owners[i] = owners[i].id
    }
    console.log(owners)
    const {data, error} = await supabase
        .from('chats')
        .insert([{name, is_group, owners, admins}])
    if (error){console.log(error); return false}
    let server_id = await getServerId(name)
    console.log(server_id)
    createChannel(server_id, 'general')
    return true
}

async function getServerId(server_name){
    const {data, error} = await supabase
        .from('chats')
        .select('id')
        .eq('name', server_name)
    console.log(data)
    return data[0].id
}

async function createChannel(server_id, channel_name){
    console.log(server_id, channel_name)
    let name = channel_name
    let chat_id = server_id
    const {data, error} = await supabase
        .from('channels')
        .insert([{name, chat_id}])
    if (error){console.log(error); return false}
    return true
}

async function getServers(requestBody){
    let username = requestBody.username
    let user_id = await getUser(username)
    user_id = user_id.id
    console.log(user_id)
    const {data, error} = await supabase
        .from('chats')
        .select('*')
        .eq('is_group', true)
    //console.log(data)
    let return_data = []
    for (let chat of data){
        if (chat.owners.includes(user_id)){return_data.push({id: chat.id, name: chat.name})}
    }
    console.log(return_data)
    return return_data
}

async function getServerData(requestBody){
    console.log(requestBody)
    let server_id = requestBody.id
    let server_name = requestBody.name
    let members = await getServerMembers(server_id)
    let channels = await getServerChannels(server_id)
    let messages = await getServerMessages(server_id)
    let admins = await getServerAdmins(server_id)
    let response = {
        members: members,
        channels: channels,
        messages: messages,
        admins: admins
    }
    console.log(response)

    return response
}

async function getServerChannels(server_id){
    const {data, error} = await supabase
        .from('channels')
        .select('*')
        .eq('chat_id', server_id)
    return data
}

async function getServerMessages(server_id){
    const {data, error} = await supabase
        .from('messages')
        .select("*")
        .eq('chat_id', server_id)
    console.log(data)
    return data
}

async function getServerMembers(server_id){
    let {data, error} = await supabase
        .from('chats')
        .select('owners')
        .eq('id', server_id)
    let response = []
    data = data[0].owners
    console.log(data)
    for (let member of data){
        let member_data = {
            id: member,
            username: await getUsername(member)
        }
        response.push(member_data)
    }
    return response
}

async function getServerAdmins(server_id){
    let {data, error} = await supabase
        .from('chats')
        .select('admins')
        .eq('id', server_id)
    data = data[0].admins
    let admins = []
    for (let admin of data){
        admin = {
            id: admin,
            username: await getUsername(admin)
        }
        admins.push(admin)
    }
    console.log(admins)
    return admins
}

async function sendGroupMessage(requestBody){
    console.log(requestBody)
    let {chat_id, channel_id, body, sender} = requestBody
    sender = await getUser(sender)
    sender = sender.id
    const {data, error} = await supabase
        .from('messages')
        .insert([{chat_id, channel_id, body, sender}])
    if (error){console.log(error)} else {return true}
}

async function getChannelMessages(requestBody){
    console.log(requestBody)
    const {chat_id, channel_id} = requestBody
    const {data, error} = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat_id)
        .eq('channel_id', channel_id)
    for (let message of data){
        message.sender = await getUsername(message.sender)
    }
    console.log(data)
    return data
}

async function createChannelAndReturnID(requestBody){
    console.log(requestBody)
    let {channel_name, chat_id} = requestBody
    await createChannel(chat_id, channel_name)
    let channels = await getServerChannels(chat_id)
    return channels
}

async function validateAdmin(server_id, username){
    let admins = await getServerAdmins(server_id)
    console.log(username)
    console.log(admins)
    for (let admin of admins){
        if (admin.username == username) {return true}
    }
    return false
}

async function KickOut(requestBody){
    console.log(requestBody)
    let id = requestBody.member.id
    revokeAdmin(requestBody) //TODO: Make sure this works
    console.log(id)
    let users = await getServerMembers(requestBody.chat_id)
    let owners = users.filter(user => user.id != id)
    owners = owners.map(user => user.id)
    console.log(owners)
    let sender = requestBody.sender
    let isAdmin = await validateAdmin(requestBody.chat_id, sender)
    console.log(isAdmin)
    if (isAdmin){
        const {data, error} = await supabase
            .from('chats')
            .update({owners: owners})
            .eq('id', requestBody.chat_id)
        if (error){console.log(error); return false}
    }
    
    let response = await getServerMembers(requestBody.chat_id)
    console.log(response)
    return response
}

async function grantAdmin(requestBody){
    console.log(requestBody)
    let id = requestBody.member.id
    let sender =  requestBody.sender
    console.log(sender)
    console.log(id)
    let admins = await getServerAdmins(requestBody.chat_id)
    admins = admins.map(admin => admin.id)
    admins.push(id)
    console.log(admins)
    let isAdmin = await validateAdmin(requestBody.chat_id, sender)
    console.log(isAdmin)
    if (isAdmin){
        const {data, error} = await supabase
            .from('chats')
            .update({admins: admins})
            .eq('id', requestBody.chat_id)
            if (error){console.log(error); return false}
    }
    let response = await getServerAdmins(requestBody.chat_id)
    console.log(response)
    return response //Not really sure why it works but alright
}

async function revokeAdmin(requestBody){
    console.log(requestBody)
    let id = requestBody.member.id
    console.log(id)
    let admins = await getServerAdmins(requestBody.chat_id)
    admins = admins.map(admin => admin.id)
    admins = admins.filter(admin => admin != id)
    console.log(admins)
    let sender = requestBody.sender
    let isAdmin = await validateAdmin(requestBody.chat_id, sender)
    console.log(isAdmin)
    if (isAdmin){
        const {data, error} = await supabase
            .from('chats')
            .update({admins: admins})
            .eq('id', requestBody.chat_id)
            if (error){console.log(error); return false}
    }
    let response = {
        admins: await getServerAdmins(requestBody.chat_id),
        users: await getServerMembers(requestBody.chat_id)
    }
    console.log(response)
    return response //Not really sure why it works but alright
}

async function InviteFriend(requestBody){
    console.log(requestBody)
    let friend = requestBody.friend
    let chat_id = requestBody.chat_id
    let sender = requestBody.sender
    let isAdmin = await validateAdmin(chat_id, sender)
    if (!isAdmin){return}
    let owners = await getServerMembers(chat_id)
    owners = owners.map(owner => owner.id)
    if (!(friend.id in owners)){owners.push(friend.id)}
    console.log(owners)
    const {data, error} = await supabase
        .from('chats')
        .update({owners: owners})
        .eq('id', chat_id)
    if (error){console.log(error); return false}
    let response = await getServerMembers(chat_id)
    for (let user of response){
        user.isAdmin = await validateAdmin(chat_id, user.username)
    }
    console.log(response)
    return response
}

export async function POST(requestEvent){
    let requestBody = await requestEvent.request.text();
    requestBody = JSON.parse(requestBody)
    let response
    if (requestBody.type == 'USER_SEARCH'){response = await userQuery(requestBody.search)}
    if (requestBody.type == 'ADD_FRIEND'){response = await addFriend(requestBody.sender_username, requestBody.friend_id)}
    if (requestBody.type == 'GET_FRIENDS'){response = await getFriends(requestBody.username)}
    if (requestBody.type == 'GET_CHAT'){response  = await getChatData(requestBody)}
    if (requestBody.type == 'GET_MESSAGES'){response = await getMessages(requestBody)}
    if (requestBody.type == 'SEND_MESSAGE'){response = await sendMessage(requestBody)}
    if (requestBody.type == 'GET_USERNAME'){response = await getUsername(requestBody.id)}
    if (requestBody.type == 'DELETE_MESSAGE'){response = await deleteMessage(requestBody.message_id)}
    if (requestBody.type == 'DELETE_FRIEND'){response = await deleteFriend(requestBody)}
    if (requestBody.type == 'GET_FRIEND_REQUESTS'){response = await getFriendRequests(requestBody)}
    if (requestBody.type == 'CREATE_GROUP_CHAT'){response = await createServer(requestBody)}
    if (requestBody.type == 'GET_SERVERS_USER_IS_MEMBER'){response = await getServers(requestBody)}
    if (requestBody.type == 'GET_SERVER_DATA'){response = await getServerData(requestBody)}
    if (requestBody.type == 'SEND_GROUP_MESSAGE'){response =  await sendGroupMessage(requestBody)}
    if (requestBody.type == 'GET_CHANNEL_MESSAGES'){response = await getChannelMessages(requestBody)}
    if (requestBody.type == 'CREATE_NEW_CHANNEL'){response = await createChannelAndReturnID(requestBody)}
    if (requestBody.type == 'KICK_OUT'){response = await KickOut(requestBody)}
    if (requestBody.type == 'GRANT_ADMIN'){response = await grantAdmin(requestBody)}
    if (requestBody.type == 'REVOKE_ADMIN'){response = await revokeAdmin(requestBody)}
    if (requestBody.type == 'INVITE_FRIEND'){response = await InviteFriend(requestBody)}
    console.log(response)
    return new Response(JSON.stringify(response))
}

