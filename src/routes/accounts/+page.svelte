<script>
    import Cookies from 'js-cookie'

    const register = async () => {
        let username = document.getElementById('usernameREG').value
        let password = document.getElementById('passwordREG').value

        if (password.length < 5){alert('Password should be at least 5 characters long');return}
        const regex = /^[a-zA-Z0-9]+$/
        if (regex.test(username) == false){alert('Username can only contain alphanumerical characters'); return}

        let requestBody = {
            username:username,
            password:password,
            type: 'REGISTER'
        }
        let response = fetch('/accounts', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        let result;
        let serverResponse = await response.then((response) => response  = response.json().then((response) => result = (response.message)))
        if (result){Cookies.set('AUTH', JSON.stringify(user)); window.location.href = '/'}
        else {alert('Username is taken')}
    }

    const login = async () => {
        let username = document.getElementById('usernameLOG').value
        let password = document.getElementById('passwordLOG').value
        let user = {
            username: username,
            password: password
        }

        let requestBody = {
            username:username,
            password:password,
            type: 'LOGIN'
        }
        let response = fetch('/accounts', {
            body: JSON.stringify(requestBody),
            method: 'POST'
        })
        let result;
        let serverResponse = await response.then((response) => response  = response.json().then((response) => result = (response.message)))
        if (result){Cookies.set('AUTH', JSON.stringify(user)); window.location.href = '/'}
        else {alert('User not found')}
    }


</script>



<h1>Register</h1>

<form on:submit={register}>
    <input type = 'text' id = 'usernameREG' required>
    <input type = 'password' id = 'passwordREG'>
    <input type = 'submit'>
</form>

<h1>Login</h1>

<form on:submit={login}>
    <input type = 'text' id = 'usernameLOG' required>
    <input type = 'password' id = 'passwordLOG'>
    <input type = 'submit'>
</form>
