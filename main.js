var config = {
    //apiKey: "<API_KEY>",
    authDomain: "whut-9f376.firebaseapp.com",
    databaseURL: "https://whut-9f376.firebaseio.com"
    }
var app = firebase.initializeApp(config);
var db = app.database();

var q = document.getElementById('questions');

db.ref("test").on("child_added", function(data) {
    console.log(data.val());
    q.innerHTML += "<p>" + data.val() + "</p>";
    console.log(q);
});

function getArrayData(ref, type) {
    return db.ref(ref).once(type).then(function(d) {
        return d.val();
    });
}

var ad = getArrayData("test", "value").then(function(d) {
    ad = d;
    console.log(ad);
});
console.log(ad);