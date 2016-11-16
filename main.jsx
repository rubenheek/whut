const config = {
        authDomain: "whut-9f376.firebaseapp.com",
        databaseURL: "https://whut-9f376.firebaseio.com"
    }
let app = firebase.initializeApp(config);
let db = app.database();

function getData(ref, type) {
    return db.ref(ref).once(type).then((d) => {
        return d.val();
    });
}

const Letters = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            letters: []
        }
    },
    componentWillMount() {
        var ref = firebase.database().ref("test");
        this.bindAsArray(ref, "letters");
    },
    render() {
        return(
            <ul>
                {this.state.letters.map((letter, index) => {
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