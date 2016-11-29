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

const QuestionForm = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            text: ''
        }
    },
    pushQuestion(e) {
        e.preventDefault();
        this.firebaseRefs['letters'].push(
            this.state.text
        );
        this.setState({text: ""});
    },
    onChange(e) {
        this.setState({text: e.target.value});
    },
    componentWillMount() {
        let ref = firebase.database().ref("test");
        this.bindAsArray(ref, "letters");
    },
    render() {
        return (
            <form onSubmit={this.pushQuestion}>
             <input onChange={this.onChange} value={this.state.text}/>
             <button>ask</button>
            </form>
        )
    }
});

const Questions = React.createClass({
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
    deleteQuestion(key) {
        console.log(key);
        this.firebaseRefs['letters'].child(key).remove();
    },
    render() {
        return(
            <ul>
                {this.state.letters.map((letter, index) => {
                    return (
                        <li>
                         <span key={index}>{letter['.value']}</span>
                         <button onClick={this.deleteQuestion.bind(this, index)}>delete</button>
                        </li>
                    )
                })}
            </ul>
        );
    }
});