import Search from './modules/search'
import Chat from './modules/chat'
import RegistrationForm from './modules/registrationForm'

// if the chat wrapper exists
if(document.querySelector("#chat-wrapper")){
    new Chat();
}

//only if you are loggin this will start
if(document.querySelector(".header-search-icon")){
    new Search()
}


//only if you are loggin this will start
if(document.querySelector("#registration-form")){
    new RegistrationForm()
}
