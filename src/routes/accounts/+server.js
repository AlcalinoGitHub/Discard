import {supabase} from '$lib/supabase.js'
import { sha256, sha224 } from 'js-sha256';
import {login} from '$lib/auth.js'

async function register(username, password){
    const {data, error} = await supabase
        .from('users')
        .insert([{username, password}])
    if (error){console.log(error); return false}
    else {console.log('user created');return true}
}


export async function POST(requestEvent){
    let requestBody = await requestEvent.request.text();
    requestBody = JSON.parse(requestBody)
    const username = requestBody.username
    const password = sha256(requestBody.password)
    let state;

    if (requestBody.type == 'REGISTER'){state = await register(username, password)}
    if (requestBody.type == 'LOGIN')   {state = await login(username, password)}

    console.log(state)

    return new Response(JSON.stringify({message: state}))
}