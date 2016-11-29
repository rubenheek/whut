const Login = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            studentID: ''
        }
    },
    addStudent(e) {
        e.preventDefault();
        this.firebaseRefs['students'].child(this.state.text).set({
            'name': '',
            'lessons': []
        }, (callback) => console.log(callback));
        // this.firebaseRefs['students'].push(
        //     this.state.text
        // );
        this.setState({studentID: ""});
    },
    onChange(e) {
        this.setState({text: e.target.value});
    },
    componentWillMount() {
        let ref = firebase.database().ref('students');
        this.bindAsObject(ref, 'students');
    },
    render() {
        return (
            <form onSubmit={this.addStudent}>
             <input onChange={this.onChange} value={this.state.text}/>
             <button>Login</button>
            </form>
        )
    }
});