import {supabase} from '$lib/supabase.js'
async function getFriends(username){
    const {data, error} = await supabase
        .from('users')
        .select('friends')
        .eq('username', username)
    if (error) console.log(error)
    let friendData = await getFriendData(data)
    console.log(friendData)
    return JSON.stringify(friendData)
}

async function getFriendData(friends){
    friends = (friends[0].friends)
    let friend_data = []
    for (let friend_id of friends){
        const {data, error} = await supabase
            .from('users')
            .select('*')
            .eq('id', friend_id)
        if (error){console.log(error)} else {friend_data.push(data[0])}
    }
    friend_data = friend_data.map(friend => {return {id: friend.id, username: friend.username}})
    return friend_data
}

async function userQuery(query){
    const {data, error} = await supabase
        .from('users')
        .select('*')
    if (error){console.log(error)}
    let results
    results = data.filter(user => user.username.startsWith(query))
    results = results.map(user => {return {id: user.id, username: user.username}})  
    return {users: results}
}

export {getFriends, userQuery}