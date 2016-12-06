var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;
var hashHistory = ReactRouter.hashHistory;

const App = React.createClass({
    render() {
        return(
            <div>
                <div className="toolbar">
                    <span>?</span>
                    <span>Whut - app2</span>
                </div>
                {this.props.children}
            </div>
        )
    }
});

const Default = React.createClass({
    render() {
        return(
            <div>
             <p>No match</p>
             <Link to="/login">login</Link>
            </div>
        )
    }
});

//login form
const Login = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            studentID: ""
        }
    },
    addStudent(e) {
        e.preventDefault();
        let studentID = this.state.studentID;
        let ref = firebase.database().ref('students');
        ref.once('value', (snapshot) => {
            if(snapshot.hasChild(studentID)) {
                console.log(studentID +  'exists');
                hashHistory.push('/student/' + studentID);
            } else {
                this.setState({studentID: ""});
                this.firebaseRefs['students'].child(studentID).set({
                    'name': '',
                    'lessons': []
                }, (callback) => {
                    console.log(callback);
                    hashHistory.push('/student/' + studentID);
                });
            }
        });
           
    },
    handleChange(e) {
        this.setState({studentID: e.target.value});
    },
    componentWillMount() {
        let ref = firebase.database().ref('students');
        this.bindAsObject(ref, 'students');
        //remove bind, use at addStudent() instead 
    },
    render() {
        return (
            <form onSubmit={this.addStudent}>
             <input type="text" value={this.state.studentID} placeholder="leerlingnummer" onChange={this.handleChange}/>
             <input type="submit" value="Login"/>
            </form>
        )
    }
});

//overview for student with groups he added
const Overview = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            groups: [],
            name: {}
        }
    },
    componentWillMount() {
        let groupsRef = firebase.database().ref('students/' + this.props.params.studentID + '/groups');
        this.bindAsArray(groupsRef, 'groups');
        let nameRef = firebase.database().ref('students/' + this.props.params.studentID + '/name');
        this.bindAsObject(nameRef, 'name');
    },
    render() {
        let noGroups;
        if(!this.state.groups.length) {
            noGroups = (<li>Not enrolled in any groups yet</li>);
        }
        console.log(this.state.name['.value']);
        return ( 
            <div>
                <p>Welkom {this.state.name['.value'] || this.props.params.studentID}</p>
                <span>Groups</span>
                <ul>
                    {noGroups}
                    {this.state.groups.map((group, index) => {
                        return (
                            <li key={index}>
                                <Link to={"student/" + this.props.params.studentID + "/group/" + index}>{group.name}</Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
        )
    }
});

//question form
const GroupForm = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            group: {
                questions: []
            },
            questions: [],
            questionInput: ""
        }
    },
    componentWillMount() {
        let groupRef = firebase.database().ref('groups/' + this.props.params.groupID);
        this.bindAsObject(groupRef, 'group');
        let questionsRef = firebase.database().ref('groups/' + this.props.params.groupID + '/questions');
        this.bindAsArray(questionsRef, 'questions');
    },
    handleChange(e) {
        this.setState({questionInput: e.target.value});
    },
    pushQuestion(e) {
        e.preventDefault();
        this.firebaseRefs['group'].child('questions').push({
            student: this.props.params.studentID,
            text: this.state.questionInput
        });
        this.setState({questionInput: ""});
    },
    render() {
        let noQuestions;
        if(!this.state.questions) {
            noQuestions = (<li>No questions asked yet</li>);
        }
        console.log(this.state.questions);
        return (
            <div>
                <h3>{this.state.group.name}</h3>
                <span>Questions</span>
                <lu>
                    {noQuestions}
                    {this.state.questions.map((question, index) => {
                        console.log(question);
                        return (
                            <li key={index}>{question.text}</li>
                        )
                    })}
                </lu>
                <br/>
                <form onSubmit={this.pushQuestion}>
                    <input type="text" value={this.state.questionInput} placeholder="question" onChange={this.handleChange}/>
                    <input type="submit" value="Ask"/>
                </form>
            </div>
        )
    }
});

//  {this.state.group.questions.map(() => {
//                         return(
//                             <li>
//                                 <span>li</span>
//                             </li>
//                         )
//                     })}

//routing
ReactDOM.render(
    <Router history={hashHistory}>
        <Route path="/" component={App}>
            <Route path="login" component={Login}/>
            <Route path="student/:studentID" component={Overview}/>
            <Route path="student/:studentID/group/:groupID" component={GroupForm}/>
        </Route>
        <Route path="*" component={Default}/>
    </Router>,
    document.getElementById('content'));