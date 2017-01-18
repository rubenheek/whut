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
                    <span>App 2</span>
                    <span></span>
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
             <button onClick={this.teacherLogin}>Docent login</button>
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
            name: {},
            groupInput: ''
        }
    },
    componentWillMount() {
        let groupsRef = firebase.database().ref('students/' + this.props.params.studentID + '/groups');
        this.bindAsArray(groupsRef, 'groups');
        let nameRef = firebase.database().ref('students/' + this.props.params.studentID + '/name');
        this.bindAsObject(nameRef, 'name');
    },
    handleChange(e) {
        this.setState({groupInput: e.target.value});
    },
    joinGroup(e) {
        e.preventDefault();
        firebase.database().ref('groups/' + this.state.groupInput).once('value', (snapshot) => {
            console.log(snapshot.val());
            if(snapshot.val()) {
                console.log(snapshot.val());
                this.firebaseRefs['groups'].push(this.state.groupInput);
                //hashHistory.push('/student/' + this.props.params.studentID + '/group/' + this.state.groupInput);
            } else {
                alert('Ongeldige groep ID');
            };
        });
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
                    {this.state.groups.map((group) => {
                        console.log(group.value);
                        return (
                            <li key={group['.key']}>
                                <Link to={"student/" + this.props.params.studentID + "/group/" + group['.value']}>{group['.value']}</Link>
                            </li>
                        )
                    })}
                </ul>
                <form onSubmit={this.joinGroup}>
                    <input type="text" value={this.state.groupInput} placeholder="Groep toevoegen" onChange={this.handleChange}/>
                    <input type="submit" value="Voeg toe"/>
                </form>
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
                <h1>{this.props.params.groupID}</h1>
                <span>Questions</span>
                <lu>
                    {noQuestions}
                    {this.state.questions.map((question, index) => {
                        if(question.student == this.props.params.studentID) {
                            return (<li key={index}>{question.text}</li>);
                        }
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

//teacher overview
const TeachterOverview = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            groups: []
        }
    },
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
    componentWillMount() {
        let groupsRef = firebase.database().ref('groups');
        this.bindAsArray(groupsRef, 'groups');
    },
    render() {
        return (
            <div>
             {this.state.groups.map((group, index) => {
                 let groupLI;
                 console.log(group['.key']);
                 if(group.owner == this.props.params.teacherID) {
                     return (<li key={index}>
                                 <Link to={"teacher/" + this.props.params.studentID + "/group/" + group['.key']}>{group['.key']}</Link>
                                </li>);
                 }
             })}
             <button onClick={this.createGroup}>Maak klas aan</button>
            </div>
        )
    }
});

//teacher group overview
const GroupOverview = React.createClass({
    mixins: [ReactFireMixin],
    getInitialState() {
        return {
            group: {
                questions: []
            }
        }
    },
    componentWillMount() {
        let questionsRef = firebase.database().ref('groups/' + this.props.params.groupID + '/questions');
        this.bindAsArray(questionsRef, 'questions');
        
    },
    render() {
        let noQuestions;
        if(!this.state.questions.length) {
            noQuestions = (<li>No questions asked yet</li>);
        }
        return (
                <div>
                    <h1>{this.props.params.groupID}</h1>
                    <span>Questions</span>
                    <lu>
                        {noQuestions}
                        {this.state.questions.map((question, index) => {
                            return (
                                <li key={index}>{question.text}</li>
                            )
                        })}
                    </lu>
                </div>
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