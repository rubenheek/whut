const config = {
    authDomain: "whut-9f376.firebaseapp.com",
    databaseURL: "https://whut-9f376.firebaseio.com"
    }
var app = firebase.initializeApp(config);
var db = app.database();

function getData(ref, type) {
    return db.ref(ref).once(type).then((d) => {
        return d.val();
    });
}

const Letters = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState: function() {
        return {
            letters: []
        }
    },
    componentWillMount: function() {
        var ref = firebase.database().ref("test");
        this.bindAsArray(ref, "letters");
    },
    render: function() {
        return(
            <ul>
                {this.state.letters.map(function(letter, index) {
                    return <li key={index}>{letter['.value']}</li>;
                })}
            </ul>
        );
    }
});

ReactDOM.render(
    <Letters/>,
    document.getElementById('content')
);

// db.ref("test").on("child_added", (data) => {
//     console.log(data.val());
//     q.innerHTML += "<p>" + data.val() + "</p>";
// });

// let ad = getData("test", "value").then((d) => {
//     ad = d;
//     console.log(ad);
// });