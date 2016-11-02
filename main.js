var config = {
    //apiKey: "<API_KEY>",
    authDomain: "whut-9f376.firebaseapp.com",
    databaseURL: "https://whut-9f376.firebaseio.com"
    }
var app = firebase.initializeApp(config);

app.database().ref("test").set(["a", "b", "c"]);