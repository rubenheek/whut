var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;
var hashHistory = ReactRouter.hashHistory;

const App = React.createClass({
    render() {
        return(
            <div>
                <h1>App</h1>
                <Link to="/login">login</Link>
                <hr/>
                <div>
                    {this.props.children}
                </div>
            </div>
        )
    }
});

const Default = React.createClass({
    render() {
        return(
            <p>No match</p>
        )
    }
});

const Login = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            studentID: ""
        }
    },
    addStudent(e) {
        e.preventDefault();
        this.firebaseRefs['students'].child(this.state.studentID).set({
            'name': '',
            'lessons': []
        }, (callback) => console.log(callback));
        this.setState({studentID: ""});
        hashHistory.push('/student/' + this.state.studentID);
    },
    handleChange(e) {
        this.setState({studentID: e.target.value});
    },
    componentWillMount() {
        let ref = firebase.database().ref('students');
        this.bindAsObject(ref, 'students');
    },
    render() {
        return (
            <form onSubmit={this.addStudent}>
             <input type="test" value={this.state.studentID} placeholder="leerlingnummer" onChange={this.handleChange}/>
             <input type="submit" value="Login"/>
            </form>
        )
    }
});

const Overview = React.createClass({
    mixins: [ReactFireMixin],
    componentWillMount() {
        let ref = firebase.database().ref('students' + this.props.params.studentID + 'groups');
        this.bindAsObject(ref, 'groups');
    },
    render() {
        return (
            <p>Willkommen {this.props.params.studentID}</p>
        )
    }
});

ReactDOM.render(
    <Router history={hashHistory}>
        <Route path="/" component={App}>
            <Route path="login" component={Login}/>
            <Route path="student">
                <Route path=":studentID" component={Overview}/>
            </Route>
        </Route>
        <Route path="*" component={Default}/>
    </Router>,
    document.getElementById('content'));