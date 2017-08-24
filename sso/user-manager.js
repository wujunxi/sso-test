

function login(username,password){
    if(username == 'admin' && password == '123456'){
        return {
            id:'001',
            username:'admin'
        };
    }
}

module.exports = {
    login
};