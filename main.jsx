// import React from 'react';
// import reactDOM from 'react-dom';
// import firebase from 'firebase';
// import reactfire from 'reactfire';
// import {Router, Route, Link, hashHistory} from 'react-router';

const config = {
        authDomain: "whut-9f376.firebaseapp.com",
        databaseURL: "https://whut-9f376.firebaseio.com"
    }
let app = firebase.initializeApp(config);
let db = app.database();

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
                console.log(studentID +  ' exists');
                hashHistory.push('/student/' + studentID);
            } else {
                console.log('adding ' + studentID);
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
    teacherLogin() {
        let teacherID = 'grj';
        hashHistory.push('/teacher/' + teacherID);
    },
    render() {
        return (
            <div>
             <form onSubmit={this.addStudent}>
              <input type="text" value={this.state.studentID} placeholder="leerlingnummer" onChange={this.handleChange}/>
              <input type="submit" value="Login"/>
             </form>
             <button onClick={this.teacherLogin}>Wacht ff, ik ben een docent</button>
            </div>
        )
    }
});

//overview for student with groups he added
const StudentOverview = React.createClass({
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
        console.log(this.state.questionInput);
        if(!this.state.questionInput) {
            return;
        }
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
        return (
            <div>
                <h3>{this.state.group.name}</h3>
                <span>Questions</span>
                <lu>
                    {noQuestions}
                    {this.state.questions.map((question, index) => {
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

const TeachterOverview = React.createClass({
    mixins: [ReactFireMixin],
    checkID(id) {
        let groupsRef = firebase.database().ref('groups');
        groupsRef.once('value', (snapshot) => {
            if(snapshot.hasChild(id)) {
                this.checkID(this.generateID());
            } else {
                console.log('adding ' + id);
                this.addGroup(id);
            }
        });
    },
    generateID() {
        let id = '';
        for(let i=0; i<7; i++) {
            id += Math.floor(Math.random()*10).toString();
        }
        return id;
    },
    addGroup(id) {
        firebase.database().ref('groups').child(id).set({
            'owner': this.props.params.teacherID
        }, (callback) => {
            console.log(callback);
            hashHistory.push('/teacher/' + this.props.params.teacherID + '/group/' + id);
        });
    },
    createGroup() {
        this.checkID(this.generateID());    
    },
    render() {
        return (
            <button onClick={this.createGroup}>Maak klas aan</button>
        )
    }
});

const GroupOverview = React.createClass({
    render() {
        return (
            <span>{this.props.params.groupID}</span>
        )
    }
});

//routing
ReactDOM.render(
    <Router history={hashHistory}>
        <Route path="/" component={App}>
            <Route path="login" component={Login}/>
            <Route path="student/:studentID" component={StudentOverview}/>
            <Route path="student/:studentID/group/:groupID" component={GroupForm}/>
            <Route path="teacher/:teacherID" component={TeachterOverview}/>
            <Route path="teacher/:teacherID/group/:groupID" component={GroupOverview}/>
        </Route>
        <Route path="*" component={Default}/>
    </Router>,
    document.getElementById('content'));