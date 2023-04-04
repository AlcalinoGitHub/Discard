import {supabase} from '$lib/supabase.js'

export async function login(username, password){
    const {data, error} = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
    
    if (data.length != 0){return true} else {return false}
}

export async function validateUser(authData){
    let userData = JSON.parse(authData);
    let req = {
        username: userData.username,
        password: userData.password,
        type: 'LOGIN'
    }
    let response = fetch('/accounts', {
        body: JSON.stringify(req),
        method: 'POST'
    })
    let result;
    let serverResponse = await response.then((response) => response  = response.json().then((response) => result = (response.message)))
    return result
}